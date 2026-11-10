'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { providers } from '@/index';
import { ChatsResponseDto, UsersResponseDto } from '@/types/global';
import { useChatSocket, CHAT_SERVER_URL } from '@/app/dashboard/COM/chat/components/ChatSocketProvider';

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

// Valeurs du champ `status` en base
export type MessageStatus = 'unread' | 'read' | 'deleted';

export interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  file?: string;                          // nom serveur, ou blob: pendant l'envoi
  fileName?: string;                      // nom d'origine (affichage)
  localUrl?: string;                      // blob local conservé côté expéditeur (lecture fiable)
  createdAt: string;
  status?: 'sending' | 'sent' | 'failed'; // envoi optimiste (local)
  readStatus?: MessageStatus;             // champ `status` de la base
  voiceDurationMs?: number;
  isVoice?: boolean;
  callDuration?: number | null;
  callStatus?: boolean | null;
}

export interface ConversationState {
  lastMessage?: string;
  lastMessageDate?: string;
  lastSenderId?: number;
  lastReadStatus?: MessageStatus;
  unreadCount: number;
  isOnline: boolean;
}

// Activité d'écriture d'un partenaire
export type WritingKind = 'typing' | 'recording';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const isAudioFile = (f?: string) =>
  !!f && /\.(m4a|aac|mp3|wav|3gp|amr|ogg|opus|caf|webm)(\?.*)?$/i.test(f);
const isLocalUri = (f?: string) => !!f && /^(file|content|blob|data):/i.test(f);
const genId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);

const previewOf = (content?: string, file?: string, isVoice?: boolean) =>
  content || (file ? (isVoice || isAudioFile(file) ? '🎤 Message vocal' : '📎 Pièce jointe') : '');

/**
 * La durée d'une note vocale est stockée dans le champ `title` de userchat
 * (aucune migration nécessaire) sous la forme "voice:12345" (millisecondes).
 */
const VOICE_TITLE = /^voice:(\d+)$/;
const encodeVoiceTitle = (ms?: number) => (ms && ms > 0 ? `voice:${Math.round(ms)}` : '');
const decodeVoiceTitle = (title?: string | null) => {
  const m = title ? VOICE_TITLE.exec(title) : null;
  return m ? Number(m[1]) : undefined;
};

// Statut "supprimé" (valeur stockée dans le champ `status` en base)
const DELETED_STATUS: MessageStatus = 'deleted';
export const DELETED_LABEL = 'Ce message a été supprimé';

// Durée d'affichage "écrit..." sans nouvel évènement (ms)
const WRITING_TIMEOUT = 3500;

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
  // { idDuPartenaire: 'typing' | 'recording' }
  const [writing, setWriting] = useState<Record<number, WritingKind>>({});
  const [loader, setLoader] = useState(true);
  const [historyVersion, setHistoryVersion] = useState(0);

  const selectedRef = useRef<Collaborator | null>(null);
  useEffect(() => { selectedRef.current = selectedCollaborator; }, [selectedCollaborator]);

  const emittedRef = useRef<Set<number>>(new Set());
  const filesRef = useRef<Map<number, File | undefined>>(new Map());
  const writingTimers = useRef<Record<number, any>>({});
  const lastTypingEmit = useRef(0);

  /** Demande un rechargement de l'historique (ex: après un appel) */
  const bumpHistory = useCallback(() => setHistoryVersion((v) => v + 1), []);

  // Retire un partenaire de la liste "en train d'écrire"
  const clearWriting = useCallback((id: number) => {
    clearTimeout(writingTimers.current[id]);
    setWriting((p) => {
      if (!(id in p)) return p;
      const { [id]: _removed, ...rest } = p;
      return rest;
    });
  }, []);

  // Nettoyage des timers au démontage
  useEffect(() => () => {
    Object.values(writingTimers.current).forEach((t) => clearTimeout(t));
  }, []);

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
          const isDeleted = msg.status === DELETED_STATUS;
          const readStatus: MessageStatus = isDeleted
            ? 'deleted'
            : msg.status === 'unread' ? 'unread' : 'read';
          // non lu pour moi = message reçu, encore unread (appels réussis exclus)
          const countsAsUnread =
            rId === currentUserId && readStatus === 'unread' && (!isCall || msg.callStatus === false);

          const voiceMs = decodeVoiceTitle(msg.title);

          (grouped[partnerId] ||= []).push({
            id: msg.id, senderId: sId, receiverId: rId,
            // un message supprimé ne garde ni texte ni fichier
            content: isDeleted ? '' : msg.content || '',
            file: isDeleted ? undefined : msg.file || undefined,
            isVoice: !isDeleted && isAudioFile(msg.file),
            voiceDurationMs: isDeleted ? undefined : voiceMs,
            createdAt: msg.createdAt,
            status: 'sent',
            readStatus,
            callDuration: msg.callDuration ?? null,
            callStatus: msg.callStatus ?? null,
          });

          latest[partnerId] = new Date(msg.createdAt).getTime();
          convs[partnerId] = {
            lastMessage: isDeleted
              ? DELETED_LABEL
              : isCall
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
      // `=== 'unread'` : ne jamais écraser un message supprimé
      [partnerId]: (p[partnerId] || []).map((m) =>
        m.senderId === partnerId && m.readStatus === 'unread' ? { ...m, readStatus: 'read' } : m),
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

  // ------------------------------------------------------------ Suppression de messages
  // Passe des messages à "supprimé" en local (expéditeur ET destinataire).
  // `messages` est un Record par conversation : on parcourt chaque liste.
  const markAsDeleted = useCallback((ids: number[]) => {
    setMessages((prev) => {
      let changed = false;
      const next: Record<number, ChatMessage[]> = { ...prev };

      for (const key of Object.keys(prev)) {
        const partnerId = Number(key);
        const list = prev[partnerId];
        if (!list?.some((m) => ids.includes(m.id))) continue; // conversation non concernée

        changed = true;
        next[partnerId] = list.map((m) =>
          ids.includes(m.id)
            ? {
              ...m,
              readStatus: DELETED_STATUS,
              content: '',
              file: undefined,
              localUrl: undefined,
              fileName: undefined,
              isVoice: false,
              voiceDurationMs: undefined,
            }
            : m
        );
      }
      return changed ? next : prev;
    });
  }, []);

  // Annulation ciblée si la requête échoue (ne touche pas aux messages arrivés entre-temps)
  const restoreMessages = useCallback((originals: ChatMessage[]) => {
    setMessages((prev) => {
      const next: Record<number, ChatMessage[]> = { ...prev };
      for (const key of Object.keys(prev)) {
        const partnerId = Number(key);
        next[partnerId] = prev[partnerId].map(
          (m) => originals.find((o) => o.id === m.id) ?? m
        );
      }
      return next;
    });
  }, []);

  // Suppression côté expéditeur : mise à jour optimiste, puis requête update, puis socket
  const deleteMessages = useCallback(
    async (ids: number[]) => {
      if (!ids.length || !selectedCollaborator) return;

      const originals = Object.values(messages).flat().filter((m) => ids.includes(m.id));
      markAsDeleted(ids);

      try {
        // Requête update : status -> "deleted" pour chaque id
        await Promise.all(
          ids.map((id) =>
            providers.API.update(serverUrl, 'chats', null, { status: DELETED_STATUS }, id)
          )
        );

        // Prévient le destinataire en temps réel (le serveur doit relayer cet évènement)
        socket?.emit('messages_deleted', {
          ids,
          senderId: currentUserId,
          receiverId: selectedCollaborator.id,
        });

        // Resynchronise l'aperçu de la liste des discussions
        loadHistory();
      } catch (err) {
        restoreMessages(originals); // annulation
        throw err; // la page affiche l'erreur
      }
    },
    [messages, selectedCollaborator, socket, currentUserId, serverUrl, markAsDeleted, restoreMessages, loadHistory]
  );

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
      const voiceMs = Number(data.voiceDurationMs);
      const newMsg: ChatMessage = {
        id: data.id || genId(),
        senderId, receiverId: currentUserId,
        content: data.path || data.content || '',
        file: rawFile,
        isVoice: data.isVoice === true || isAudioFile(rawFile),
        voiceDurationMs: voiceMs > 0 ? voiceMs : undefined,
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

      // le message est arrivé : il n'est plus "en train d'écrire / d'enregistrer"
      clearWriting(senderId);

      // conversation déjà ouverte : lu immédiatement (socket + PUT en base)
      if (isOpen) markAsRead(senderId);
    };

    // Le destinataire a lu mes messages => 'messagesRead' { by: idDuLecteur }
    const onRead = (d: any) => {
      const partnerId = Number(d?.by);
      if (!partnerId) return;
      setMessages((p) => ({
        ...p,
        // `=== 'unread'` : ne jamais écraser un message supprimé
        [partnerId]: (p[partnerId] || []).map((m) =>
          m.senderId === currentUserId && m.readStatus === 'unread' ? { ...m, readStatus: 'read' } : m),
      }));
      setConversations((p) =>
        p[partnerId] && p[partnerId].lastReadStatus !== 'deleted'
          ? { ...p, [partnerId]: { ...p[partnerId], lastReadStatus: 'read' } }
          : p);
    };

    // Évènement serveur 'writing' => { from: idDeLExpediteur, message: 'typing' | 'recording' | 'stop' }
    const onWriting = (d: any) => {
      const from = Number(d?.from);
      if (!from || from === currentUserId) return;
      const kind = d?.message as WritingKind | 'stop';

      if (kind === 'stop') {
        clearWriting(from);
        return;
      }

      const next: WritingKind = kind === 'recording' ? 'recording' : 'typing';
      setWriting((p) => (p[from] === next ? p : { ...p, [from]: next }));

      // auto-extinction si plus aucun évènement n'arrive
      clearTimeout(writingTimers.current[from]);
      writingTimers.current[from] = setTimeout(() => clearWriting(from), WRITING_TIMEOUT);
    };

    // L'expéditeur a supprimé des messages => 'messages_deleted' { ids }
    const onDeleted = (d: any) => {
      const ids: number[] = Array.isArray(d?.ids) ? d.ids.map(Number) : [];
      if (!ids.length) return;
      markAsDeleted(ids);
      loadHistory(); // aperçu + ids réels si le message local avait un id temporaire
    };

    socket.on('getChatData', onChat);
    socket.on('messagesRead', onRead);
    socket.on('writing', onWriting);
    socket.on('messages_deleted', onDeleted);
    return () => {
      socket.off('getChatData', onChat);
      socket.off('messagesRead', onRead);
      socket.off('writing', onWriting);
      socket.off('messages_deleted', onDeleted);
    };
  }, [socket, currentUserId, markAsRead, clearWriting, markAsDeleted, loadHistory]);

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
    const res: any = await providers.API.post(serverUrl, 'media/upload-single', null, { file });
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
        // `localUrl` reste le blob : l'expéditeur continue de lire le fichier local,
        // le <audio> n'est donc pas rechargé quand `file` devient le nom serveur.
        patchMessage(partnerId, msg.id, { file: filename });
      }

      // 1. Enregistrement en base d'abord (le message existe avant que le
      //    destinataire puisse le marquer comme lu)
      const saved: any = await providers.API.post(serverUrl, 'chats', null, {
        title: msg.isVoice ? encodeVoiceTitle(msg.voiceDurationMs) : '',
        senderId: currentUserId,
        receiverId: partnerId,
        content: msg.content,
        file: filename,
        role: 'client',
        callDuration: null,
        callStatus: null,
      });

      // Remplace l'id temporaire par l'id réel de la base : indispensable pour pouvoir
      // supprimer le message juste après l'envoi (adaptez le chemin si votre API répond autrement)
      const realId = Number(saved?.data?.id ?? saved?.id);
      patchMessage(partnerId, msg.id, {
        status: 'sent',
        ...(Number.isFinite(realId) && realId > 0 ? { id: realId } : {}),
      });

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
          voiceDurationMs: msg.voiceDurationMs,
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
    const url = file ? URL.createObjectURL(file) : undefined;
    const msg: ChatMessage = {
      id: genId(), senderId: currentUserId, receiverId: collab.id,
      content: text,
      file: url,
      localUrl: url,
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
    const url = URL.createObjectURL(file);
    const msg: ChatMessage = {
      id: genId(), senderId: currentUserId, receiverId: collab.id,
      content: '', file: url, localUrl: url, fileName: file.name,
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

  /**
   * Prévient le partenaire que j'écris / j'enregistre un vocal / j'arrête.
   * Émet 'onWrite' vers le backend, qui relaie 'writing' au destinataire.
   * Seul 'typing' est limité (1 émission / 2 s) ; 'recording' et 'stop' passent toujours.
   */
  const emitWriting = (kind: WritingKind | 'stop' = 'typing') => {
    if (!socket || !selectedCollaborator) return;
    if (kind === 'typing') {
      const now = Date.now();
      if (now - lastTypingEmit.current < 2000) return;
      lastTypingEmit.current = now;
    }
    socket.emit('onWrite', {
      senderId: currentUserId,
      receiverId: selectedCollaborator.id,
      message: kind,
    });
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
    deleteMessages,
    emitWriting,
    writing,
    markAsRead,
    bumpHistory,
    socket,
    connected,
    loader,
    currentUserId,
  };
};
