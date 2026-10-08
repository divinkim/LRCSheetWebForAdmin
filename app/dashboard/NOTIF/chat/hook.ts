'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { providers } from '@/index';
import { ChatsResponseDto, UsersResponseDto } from '@/types/global';
import { useChatSocket, CHAT_SERVER_URL } from '@/components/call/ChatSocketProvider';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export interface Collaborator {
  id: number;
  firstname: string;
  lastname?: string;
  email: string;
  photo?: string;
  role?: string;
  Post?: { title: string };
}

export interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  file?: string;                          // nom serveur, ou blob: pendant l'envoi
  fileName?: string;                      // nom d'origine (affichage)
  createdAt: string;
  status?: 'sending' | 'sent' | 'failed'; // envoi optimiste (local)
  readStatus?: 'unread' | 'read';         // champ `status` de la base
  voiceDurationMs?: number;
  isVoice?: boolean;
  callDuration?: number | null;
  callStatus?: boolean | null;
}

export interface ConversationState {
  lastMessage?: string;
  lastMessageDate?: string;
  lastSenderId?: number;
  lastReadStatus?: 'unread' | 'read';
  unreadCount: number;
  isOnline: boolean;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const isAudioFile = (f?: string) =>
  !!f && /\.(m4a|aac|mp3|wav|3gp|amr|ogg|opus|caf|webm)(\?.*)?$/i.test(f);
const isLocalUri = (f?: string) => !!f && /^(file|content|blob|data):/i.test(f);
const genId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);

const previewOf = (content?: string, file?: string, isVoice?: boolean) =>
  content || (file ? (isVoice || isAudioFile(file) ? '🎤 Message vocal' : '📎 Pièce jointe') : '');

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */
export const useCollaboratorsChat = () => {
  const serverUrl = CHAT_SERVER_URL;
  const { data: session } = useSession();
  const currentUserId = Number((session?.user as any)?.id);
  const { socket, connected, onlineUserIds } = useChatSocket();

  const [initialCollaborators, setInitialCollaborators] = useState<Collaborator[]>([]);
  const [collaboratorsOrder, setCollaboratorsOrder] = useState<number[]>([]);
  const [conversations, setConversations] = useState<Record<number, ConversationState>>({});
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);
  const [messages, setMessages] = useState<Record<number, ChatMessage[]>>({});
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [typingIds, setTypingIds] = useState<number[]>([]);
  const [loader, setLoader] = useState(true);
  const [historyVersion, setHistoryVersion] = useState(0);

  const selectedRef = useRef<Collaborator | null>(null);
  useEffect(() => { selectedRef.current = selectedCollaborator; }, [selectedCollaborator]);

  const emittedRef = useRef<Set<number>>(new Set());
  const filesRef = useRef<Map<number, File | undefined>>(new Map());
  const typingTimers = useRef<Record<number, any>>({});
  const lastTypingEmit = useRef(0);

  /** Demande un rechargement de l'historique (ex: après un appel) */
  const bumpHistory = useCallback(() => setHistoryVersion((v) => v + 1), []);

  // ------------------------------------------------------------ Collaborateurs
  useEffect(() => {
    (async () => {
      try {
        const list = await providers.API.getAll<UsersResponseDto>(serverUrl, 'users', null);
        setInitialCollaborators(list.data);
      } catch (err) {
        console.error('Erreur récupération collaborateurs :', err);
      }
    })();
  }, [serverUrl]);

  const filteredCollaborators = useMemo(
    () => (initialCollaborators || []).filter((c) => c.id !== currentUserId),
    [initialCollaborators, currentUserId]
  );

  // ------------------------------------------------------------ Historique
  const loadHistory = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const response = await providers.API.getAll<ChatsResponseDto>(serverUrl, 'chats', null);
      const chatData: any[] = (response as any)?.data || [];

      const grouped: Record<number, ChatMessage[]> = {};
      const convs: Record<number, ConversationState> = {};
      const latest: Record<number, number> = {};

      [...chatData]
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .forEach((msg) => {
          const sId = Number(msg.senderId);
          const rId = Number(msg.receiverId);
          if (sId !== currentUserId && rId !== currentUserId) return;
          const partnerId = sId === currentUserId ? rId : sId;
          if (!partnerId) return;

          const isCall = msg.callDuration !== undefined && msg.callDuration !== null;
          const readStatus: 'unread' | 'read' = msg.status === 'unread' ? 'unread' : 'read';
          // non lu pour moi = message reçu, encore unread (appels réussis exclus)
          const countsAsUnread =
            rId === currentUserId && readStatus === 'unread' && (!isCall || msg.callStatus === false);

          (grouped[partnerId] ||= []).push({
            id: msg.id, senderId: sId, receiverId: rId,
            content: msg.content || '',
            file: msg.file || undefined,
            isVoice: isAudioFile(msg.file),
            createdAt: msg.createdAt,
            status: 'sent',
            readStatus,
            callDuration: msg.callDuration ?? null,
            callStatus: msg.callStatus ?? null,
          });

          latest[partnerId] = new Date(msg.createdAt).getTime();
          convs[partnerId] = {
            lastMessage: isCall
              ? (msg.callStatus === false ? '📞 Appel manqué' : '📞 Appel')
              : previewOf(msg.content, msg.file),
            lastMessageDate: msg.createdAt,
            lastSenderId: sId,
            lastReadStatus: readStatus,
            unreadCount: (convs[partnerId]?.unreadCount ?? 0) + (countsAsUnread ? 1 : 0),
            isOnline: false,
          };
        });

      const order = Object.keys(latest).map(Number).sort((a, b) => latest[b] - latest[a]);
      filteredCollaborators.forEach((c) => { if (!order.includes(c.id)) order.push(c.id); });

      // on garde les messages en cours d'envoi / en échec pendant le rechargement
      setMessages((prev) => {
        const next: Record<number, ChatMessage[]> = { ...grouped };
        Object.keys(prev).forEach((k) => {
          const pid = Number(k);
          const pending = prev[pid].filter((m) => m.status === 'sending' || m.status === 'failed');
          if (pending.length) next[pid] = [...(grouped[pid] || []), ...pending];
        });
        return next;
      });
      setConversations(convs);
      setCollaboratorsOrder(order);
    } catch (e) {
      console.error("Erreur lors de la récupération de l'historique chat :", e);
    } finally {
      setLoader(false);
    }
  }, [serverUrl, currentUserId, filteredCollaborators]);

  useEffect(() => { loadHistory(); }, [loadHistory, historyVersion]);

  // ------------------------------------------------------------ Lecture (statut read)
  /**
   * Exécutée quand je clique sur un collaborateur (ou qu'un message arrive
   * dans la conversation déjà ouverte) :
   *  1. prévient l'expéditeur via le socket ('onReadMessage')
   *  2. met à jour l'UI locale (badge à 0, messages du partenaire en "read")
   *  3. PUT /chats/mark-read => passe en "read" tous les messages unread
   *     envoyés par partnerId à currentUserId
   */
  const markAsRead = useCallback(async (partnerId: number) => {
    if (!partnerId || !currentUserId) return;

    // 1. socket : le serveur relaie 'messagesRead' à l'expéditeur
    socket?.emit('onReadMessage', { senderId: partnerId, receiverId: currentUserId });

    // 2. UI locale immédiate
    setConversations((p) => ({
      ...p,
      [partnerId]: { ...(p[partnerId] || { isOnline: false }), unreadCount: 0 },
    }));
    setMessages((p) => ({
      ...p,
      [partnerId]: (p[partnerId] || []).map((m) =>
        m.senderId === partnerId && m.readStatus !== 'read' ? { ...m, readStatus: 'read' } : m),
    }));

    // 3. base de données
    try {
      await providers.API.update(serverUrl, 'chats/mark-read', null, {
        senderId: partnerId,      
        receiverId: currentUserId,
      }, null);
    } catch (e) {
      console.warn('mark-read impossible', e);
    }
  }, [socket, currentUserId, serverUrl]);

  // ------------------------------------------------------------ Temps réel
  useEffect(() => {
    if (!socket) return;

    // Nouveau message reçu
    const onChat = (data: any) => {
      const senderId = Number(data.senderId);
      const rawReceiver = Array.isArray(data.receiverId) ? data.receiverId[0] : data.receiverId;
      const receiverId = Number(rawReceiver);
      if (senderId === currentUserId) return; // écho de mes propres messages
      if (!Number.isNaN(receiverId) && receiverId !== currentUserId) return;

      const rawFile = data.file && data.file !== 'null' ? String(data.file) : undefined;
      const isOpen = selectedRef.current?.id === senderId;
      const newMsg: ChatMessage = {
        id: data.id || genId(),
        senderId, receiverId: currentUserId,
        content: data.path || data.content || '',
        file: rawFile,
        isVoice: data.isVoice === true || isAudioFile(rawFile),
        createdAt: data.createdAt || new Date().toISOString(),
        status: 'sent',
        readStatus: isOpen ? 'read' : 'unread',
      };

      setMessages((p) => ({ ...p, [senderId]: [...(p[senderId] || []), newMsg] }));
      setConversations((p) => {
        const cur = p[senderId] || { unreadCount: 0, isOnline: false };
        return {
          ...p,
          [senderId]: {
            ...cur,
            lastMessage: previewOf(newMsg.content, newMsg.file, newMsg.isVoice),
            lastMessageDate: newMsg.createdAt,
            lastSenderId: senderId,
            lastReadStatus: newMsg.readStatus,
            unreadCount: isOpen ? 0 : cur.unreadCount + 1,
          },
        };
      });
      setCollaboratorsOrder((p) => [senderId, ...p.filter((id) => id !== senderId)]);
      setTypingIds((p) => p.filter((id) => id !== senderId));

      // conversation déjà ouverte : lu immédiatement (socket + PUT en base)
      if (isOpen) markAsRead(senderId);
    };

    // Le destinataire a lu mes messages => 'messagesRead' { by: idDuLecteur }
    const onRead = (d: any) => {
      const partnerId = Number(d?.by);
      if (!partnerId) return;
      setMessages((p) => ({
        ...p,
        [partnerId]: (p[partnerId] || []).map((m) =>
          m.senderId === currentUserId && m.readStatus !== 'read' ? { ...m, readStatus: 'read' } : m),
      }));
      setConversations((p) =>
        p[partnerId] ? { ...p, [partnerId]: { ...p[partnerId], lastReadStatus: 'read' } } : p);
    };

    const onTyping = (d: any) => {
      const from = Number(d.from);
      if (!from) return;
      setTypingIds((p) => (p.includes(from) ? p : [...p, from]));
      clearTimeout(typingTimers.current[from]);
      typingTimers.current[from] = setTimeout(
        () => setTypingIds((p) => p.filter((id) => id !== from)), 3500);
    };

    socket.on('getChatData', onChat);
    socket.on('messagesRead', onRead);
    socket.on('typing', onTyping);
    return () => {
      socket.off('getChatData', onChat);
      socket.off('messagesRead', onRead);
      socket.off('typing', onTyping);
    };
  }, [socket, currentUserId, markAsRead]);

  // ------------------------------------------------------------ Envoi
  const patchMessage = useCallback((partnerId: number, id: number, changes: Partial<ChatMessage>) => {
    setMessages((p) => ({
      ...p,
      [partnerId]: (p[partnerId] || []).map((m) => (m.id === id ? { ...m, ...changes } : m)),
    }));
  }, []);

  const pushLocal = useCallback((msg: ChatMessage) => {
    setMessages((p) => ({ ...p, [msg.receiverId]: [...(p[msg.receiverId] || []), msg] }));
    setConversations((p) => ({
      ...p,
      [msg.receiverId]: {
        ...(p[msg.receiverId] || { unreadCount: 0, isOnline: false }),
        lastMessage: previewOf(msg.content, msg.file, msg.isVoice),
        lastMessageDate: msg.createdAt,
        lastSenderId: msg.senderId,
        lastReadStatus: 'unread',
      },
    }));
    setCollaboratorsOrder((p) => [msg.receiverId, ...p.filter((id) => id !== msg.receiverId)]);
  }, []);

  const uploadFile = async (file: File): Promise<string> => {
    const res: any = await providers.API.post(serverUrl, 'media/upload-single', null, { files: file });
    const name = res?.filename ?? res?.data?.filename;
    if (!name) throw new Error('Upload sans nom de fichier');
    return String(name);
  };

  const deliver = async (msg: ChatMessage, file?: File) => {
    const partnerId = msg.receiverId;
    try {
      let filename = msg.file && !isLocalUri(msg.file) ? msg.file : '';
      if (file && !filename) {
        filename = await uploadFile(file);
        patchMessage(partnerId, msg.id, { file: filename });
      }

      // 1. Enregistrement en base d'abord (le message existe avant que le
      //    destinataire puisse le marquer comme lu)
      await providers.API.post(serverUrl, 'chats', null, {
        title: '',
        senderId: currentUserId,
        receiverId: partnerId,
        content: msg.content,
        file: filename,
        role: 'client',
        callDuration: null,
        callStatus: null,
      });
      patchMessage(partnerId, msg.id, { status: 'sent' });

      // 2. Émission socket temps réel ensuite
      if (!emittedRef.current.has(msg.id)) {
        socket?.emit('onSendChatData', {
          path: msg.content,
          adminSectionIndex: '0',
          adminPageIndex: '0',
          senderId: String(currentUserId),
          receiverId: [partnerId],
          file: filename,
          isVoice: !!msg.isVoice,
        });
        emittedRef.current.add(msg.id);
      }

      // 3. Notification push (ne doit pas faire échouer l'envoi)
      try {
        await providers.API.post(serverUrl, 'notification-push', null, {
          title: 'Nouveau message',
          senderId: String(currentUserId),
          receiverId: String(partnerId),
          content: previewOf(msg.content, filename, msg.isVoice),
          messagingType: 'chat',
        });
      } catch { /* ignoré */ }
    } catch (e) {
      console.error("Échec d'envoi du message :", e);
      patchMessage(partnerId, msg.id, { status: 'failed' });
    }
  };

  const sendMessage = () => {
    const collab = selectedCollaborator;
    const text = inputText.trim();
    if ((!text && !selectedFile) || !collab || !socket) return;

    const file = selectedFile || undefined;
    const msg: ChatMessage = {
      id: genId(), senderId: currentUserId, receiverId: collab.id,
      content: text,
      file: file ? URL.createObjectURL(file) : undefined,
      fileName: file?.name,
      isVoice: false,
      createdAt: new Date().toISOString(), status: 'sending', readStatus: 'unread',
    };
    filesRef.current.set(msg.id, file);
    setInputText('');
    setSelectedFile(null);
    pushLocal(msg);
    deliver(msg, file);
  };

  const sendVoiceNote = (file: File, durationMs: number) => {
    const collab = selectedCollaborator;
    if (!collab || !socket) return;
    const msg: ChatMessage = {
      id: genId(), senderId: currentUserId, receiverId: collab.id,
      content: '', file: URL.createObjectURL(file), fileName: file.name,
      voiceDurationMs: durationMs, isVoice: true,
      createdAt: new Date().toISOString(), status: 'sending', readStatus: 'unread',
    };
    filesRef.current.set(msg.id, file);
    pushLocal(msg);
    deliver(msg, file);
  };

  const retryMessage = (msg: ChatMessage) => {
    patchMessage(msg.receiverId, msg.id, { status: 'sending' });
    deliver({ ...msg, status: 'sending' }, filesRef.current.get(msg.id));
  };

  const emitTyping = () => {
    if (!socket || !selectedCollaborator) return;
    const now = Date.now();
    if (now - lastTypingEmit.current < 2000) return;
    lastTypingEmit.current = now;
    socket.emit('typing', { from: currentUserId, to: selectedCollaborator.id });
  };

  // ------------------------------------------------------------ Divers
  const selectCollaborator = (collab: Collaborator | null) => {
    setSelectedCollaborator(collab);
    if (collab) markAsRead(collab.id);
  };

  const orderedCollaborators = useMemo(() => {
    const map = new Map(filteredCollaborators.map((c) => [c.id, c]));
    return collaboratorsOrder.map((id) => map.get(id)).filter(Boolean) as Collaborator[];
  }, [filteredCollaborators, collaboratorsOrder]);

  const currentMessages = useMemo(
    () => (selectedCollaborator ? messages[selectedCollaborator.id] || [] : []),
    [selectedCollaborator, messages]
  );

  return {
    collaborators: orderedCollaborators,
    onlineUserIds,
    conversations,
    selectedCollaborator,
    selectCollaborator,
    messages: currentMessages,
    inputText, setInputText,
    selectedFile, setSelectedFile,
    sendMessage,
    sendVoiceNote,
    retryMessage,
    emitTyping,
    typingIds,
    markAsRead,
    bumpHistory,
    socket,
    connected,
    loader,
    currentUserId,
  };
};