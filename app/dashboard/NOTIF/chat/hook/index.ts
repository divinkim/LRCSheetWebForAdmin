import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { providers } from '@/index';
import { useSession } from 'next-auth/react';

export interface Collaborator {
  id: number;
  firstname: string;
  lastname?: string;
  email: string;
  photo?: string;
  role?: string;
  Post?: { title: string };
}

export interface UserChatModel {
  id: number;
  senderId?: number;
  receiverId?: number;
  EnterpriseId?: number;
  content?: string;
  file: string | null;
  createdAt: string;
  updatedAt?: string;
  role?: string;
  title?: string;
  callStatus?: boolean;
  callDuration?: number;
}

export interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  file?: string;
  createdAt: string;
}

export interface ConversationState {
  lastMessage?: string;
  lastMessageDate?: string;
  unreadCount: number;
  isOnline: boolean;
}

export interface SelectedFile {
  name: string;
  uri: string;
  type?: string;
  size?: number;
  fileObject?: File;
}

export const useCollaboratorsChat = () => {
  const serverUrl = "https://vps118934.serveur-vps.net:4001";
  const { data: session } = useSession();

  const currentUserId = Number((session?.user as any)?.id);
  const [initialCollaborators, setInitialCollaborators] = useState<Collaborator[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
  const [collaboratorsOrder, setCollaboratorsOrder] = useState<number[]>([]);
  const [conversations, setConversations] = useState<Record<number, ConversationState>>({});
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);
  const [messages, setMessages] = useState<Record<number, ChatMessage[]>>({});
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loader, setLoader] = useState(true);
  const [fileName, setFileName] = useState("");
  // Ref pour conserver la valeur courante de selectedCollaborator dans les callbacks Socket
  const selectedCollaboratorRef = useRef<Collaborator | null>(null);
  useEffect(() => {
    selectedCollaboratorRef.current = selectedCollaborator;
  }, [selectedCollaborator]);

  // 1. Récupération de la liste initiale des collaborateurs
  useEffect(() => {
    (async () => {
      try {
        const collaboratorsList = await providers.API.getAll(serverUrl, "getUsers", null);
        setInitialCollaborators(collaboratorsList || []);
      } catch (err) {
        console.error("Erreur récupération collaborateurs :", err);
      }
    })();
  }, [serverUrl]);

  const filteredCollaborators = useMemo(() => {
    return (initialCollaborators || []).filter((c) => c.id !== currentUserId);
  }, [initialCollaborators, currentUserId]);

  // Nettoyage de l'URL temporaire de fichier (Blob)

  // 2. Récupération de l'historique de l'API au chargement
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!serverUrl || !currentUserId) return;

      try {
        const response = await providers.API.getAll(serverUrl, "getChatMessage", null);
        const chatData: UserChatModel[] = response?.datas || response || [];

        const groupedMessages: Record<number, ChatMessage[]> = {};
        const convsState: Record<number, ConversationState> = {};
        const latestDates: Record<number, number> = {};

        const sortedHistory = [...chatData].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        sortedHistory.forEach((msg) => {
          const sId = Number(msg.senderId);
          const rId = Number(msg.receiverId);

          if (sId === currentUserId || rId === currentUserId) {
            const partnerId = sId === currentUserId ? rId : sId;
            if (!partnerId) return;

            const chatMsg: ChatMessage = {
              id: msg.id,
              senderId: sId,
              receiverId: rId,
              content: msg.content || '',
              file: msg.file || undefined,
              createdAt: msg.createdAt,
            };

            if (!groupedMessages[partnerId]) {
              groupedMessages[partnerId] = [];
            }
            groupedMessages[partnerId].push(chatMsg);

            const msgTime = new Date(msg.createdAt).getTime();
            latestDates[partnerId] = msgTime;

            convsState[partnerId] = {
              lastMessage: msg.content || (msg.file ? '📎 Pièce jointe' : ''),
              lastMessageDate: msg.createdAt,
              unreadCount: 0,
              isOnline: false,
            };
          }
        });

        // Calcul de l'ordre d'affichage dans la Sidebar
        const sortedPartnerIds = Object.keys(latestDates)
          .map(Number)
          .sort((a, b) => latestDates[b] - latestDates[a]);

        filteredCollaborators.forEach((c) => {
          if (!sortedPartnerIds.includes(c.id)) {
            sortedPartnerIds.push(c.id);
          }
        });

        setMessages(groupedMessages);
        setConversations(convsState);
        setCollaboratorsOrder(sortedPartnerIds);
      } catch (error) {
        console.error("Erreur lors de la récupération de l'historique chat :", error);
      } finally {
        setLoader(false);
      }
    };

    fetchChatHistory();
  }, [serverUrl, currentUserId, filteredCollaborators.length]);

  // 3. Gestion de la connexion Socket.io (Instancié UNE SEULE FOIS)
  useEffect(() => {
    if (!serverUrl || !currentUserId) return;

    const newSocket = io(serverUrl, { transports: ['websocket'] });

    newSocket.on('connect', () => {
      newSocket.emit('register', currentUserId);
    });

    newSocket.on('usersOnline', (onlineIds: number[]) => {
      setOnlineUserIds(onlineIds);
    });

    newSocket.on('getChatData', (data: any) => {
      const senderId = Number(data.senderId);
      const receiverId = Number(data.receiverId);
      const otherPartyId = senderId === currentUserId ? receiverId : senderId;

      // Anti-doublon : Si c'est un message qu'on vient d'envoyer soi-même, on l'ignore (déjà géré en optimiste)
      if (senderId === currentUserId) return;

      const newMsg: ChatMessage = {
        id: data.id || Date.now(),
        senderId,
        receiverId,
        content: data.path || data.content || '',
        file: data.file,
        createdAt: data.createdAt || new Date().toISOString(),
      };

      setMessages((prev) => ({
        ...prev,
        [otherPartyId]: [...(prev[otherPartyId] || []), newMsg],
      }));

      setConversations((prev) => {
        const currentConv = prev[otherPartyId] || { unreadCount: 0, isOnline: false };
        const isCurrentOpen = selectedCollaboratorRef.current?.id === otherPartyId;

        return {
          ...prev,
          [otherPartyId]: {
            ...currentConv,
            lastMessage: newMsg.content || (newMsg.file ? '📎 Pièce jointe' : ''),
            lastMessageDate: newMsg.createdAt,
            unreadCount: isCurrentOpen ? 0 : currentConv.unreadCount + 1,
          },
        };
      });

      setCollaboratorsOrder((prev) => [
        otherPartyId,
        ...prev.filter((id) => id !== otherPartyId),
      ]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [serverUrl, currentUserId]); // Dépendances stables !

  const markAsRead = useCallback(
    (partnerId: number) => {
      if (socket) {
        socket.emit('onReadMessage', { senderId: partnerId, receiverId: currentUserId });
      }
      setConversations((prev) => ({
        ...prev,
        [partnerId]: { ...prev[partnerId], unreadCount: 0 },
      }));
    },
    [socket, currentUserId]
  );

  const selectCollaborator = (collab: Collaborator | null) => {
    setSelectedCollaborator(collab);
    if (collab) {
      markAsRead(collab.id);
    }
  };

  const pickDocument = () => {

  };

  const sendMessage = async () => {
    if ((!inputText.trim() && !selectedFile) || !selectedCollaborator || !socket) return;

    const nowISO = new Date().toISOString();

    // const payload = {
    //   path: inputText,
    //   adminSectionIndex: '0',
    //   adminPageIndex: '0',
    //   senderId: String(currentUserId),
    //   receiverId: [selectedCollaborator.id],
    //   file: selectedFile ? selectedFile.name : undefined,
    // };

    // 1. Émission Socket temps réel
    // socket.emit('onSendChatData', payload);

    // 2. Mise à jour optimiste de l'UI
    const newMsg: ChatMessage = {
      id: Date.now(),
      senderId: currentUserId,
      receiverId: selectedCollaborator.id,
      content: inputText,
      file: fileName,
      createdAt: nowISO,
    };
    setInputText('');
    setMessages((prev) => ({
      ...prev,
      [selectedCollaborator.id]: [...(prev[selectedCollaborator.id] || []), newMsg],
    }));

    setConversations((prev) => ({
      ...prev,
      [selectedCollaborator.id]: {
        ...prev[selectedCollaborator.id],
        lastMessage: inputText || '📎 Pièce jointe',
        lastMessageDate: nowISO,
        unreadCount: 0,
      },
    }));

    setCollaboratorsOrder((prev) => [
      selectedCollaborator.id,
      ...prev.filter((id) => id !== selectedCollaborator.id),
    ]);

    try {
      const res = await providers.API.post(serverUrl, "createChatMessage", null, {
        title: "",
        senderId: newMsg.senderId,
        receiverId: newMsg.receiverId,
        content: newMsg.content,
        file: newMsg.file,
        role: "client",
        callDuration: null,
        callStatus: null,
      });
      if (res.status) {
        const notification = await providers.API.post(serverUrl, "sendNotificationPush", null, {
          senderId: String(currentUserId),
          receiverId: String(newMsg.receiverId),
          messagingType: "chat"
        });
        console.log("notification", notification)
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message API :", error);
    }

    setSelectedFile(null);
  };

  const startCall = (type: 'audio' | 'video') => {
    if (!selectedCollaborator || !socket) return;
    socket.emit('callUser', {
      to: selectedCollaborator.id,
      from: currentUserId,
      type,
    });
  };

  const orderedCollaborators = useMemo(() => {
    const map = new Map(filteredCollaborators.map((c) => [c.id, c]));
    return collaboratorsOrder.map((id) => map.get(id)).filter(Boolean) as Collaborator[];
  }, [filteredCollaborators, collaboratorsOrder]);

  return {
    collaborators: orderedCollaborators,
    onlineUserIds,
    conversations,
    selectedCollaborator,
    selectCollaborator,
    messages: selectedCollaborator ? messages[selectedCollaborator.id] || [] : [],
    inputText,
    setInputText,
    selectedFile,
    setSelectedFile,
    pickDocument,
    sendMessage,
    startCall,
    socket,
    loader,
    currentUserId,
    serverUrl,
    initialCollaborators,
    setFileName
  };
};