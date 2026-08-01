"use client";

import { providers } from "@/index";
import { useState, useEffect, useRef, useCallback } from "react";
import { SidebarHook } from "@/components/Layouts/sidebar/hook";
import socket from "@/socket";
import { useSession } from "next-auth/react";

type Users = {
  fcmToken: string;
  UserId: number;
  UserEnterpriseId: number;
  adminRole: string | null;
  User: {
    firstname: string;
    lastname: string;
    photo: string | null;
    email: string;
  };
};

type ChatMessage = {
  role: string;
  receiverId: number;
  senderId: number;
  content: string;
  file: string;
  createdAt: string;
  title: string | null;
};

export function useChat() {
  const { data: session } = useSession();

  const sessionUserId = session?.user?.id ? Number(session.user.id) : null;

  type CustomUser = { id?: string; EnterpriseId?: number | string | null };
  const user = session?.user as CustomUser | undefined;
  const sessionEnterpriseId = user?.EnterpriseId
    ? Number(user.EnterpriseId)
    : null;

  const [users, setUsers] = useState<Users[]>([]);
  const [usersCloned, setUsersCloned] = useState<Users[]>([]);
  const [AdminId, setAdminId] = useState<number | null>(null);
  const { storedNotificationsArray } = SidebarHook();
  const [usersOnLine, setUsersOnline] = useState<number[]>([]);

  const [userData, setUserData] = useState({
    fcmToken: "",
    UserId: 0,
    email: "",
    lastname: "",
    EnterpriseId: 0,
    firstname: "",
    photo: "",
  });
  const [loader, setLoader] = useState(true);

  const ref = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState({
    content: "",
    fcmToken: "",
    receiverId: 0,
    senderId: 0,
    EnterpriseId: 0,
    files: "",
  });

  const [notificationsCountLive, setNotificationCountLive] = useState({
    status: false,
    count: 0,
    UserId: 0,
  });

  const [chatMessage, setChatMessage] = useState<ChatMessage[]>([]);

  // WEBRTC & CALL STATES
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const [callStatus, setCallStatus] = useState<
    "idle" | "ringing" | "accepted" | "rejected" | "ended"
  >("idle");
  const [callDuration, setCallDuration] = useState(0);

  // ÉTAT DE MODALE D'APPEL
  const [isCallMinimized, setIsCallMinimized] = useState(false);

  // ÉTATS ET REFS DÉDIÉS AUX FLUX MEDIA
  const [localStreamState, setLocalStreamState] = useState<MediaStream | null>(null);
  const [remoteStreamState, setRemoteStreamState] = useState<MediaStream | null>(null);

  // REFS WEBRTC INTERNES
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // CALLBACK REFS POUR L'ATTACHEMENT DOM DYNAMIQUE
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const setLocalVideoRef = useCallback((node: HTMLVideoElement | null) => {
    localVideoRef.current = node;
    if (node && localStream.current) {
      node.srcObject = localStream.current;
    }
  }, []);

  const setRemoteVideoRef = useCallback((node: HTMLVideoElement | null) => {
    remoteVideoRef.current = node;
    if (node && remoteStreamState) {
      node.srcObject = remoteStreamState;
    }
  }, [remoteStreamState]);

  const setRemoteAudioRef = useCallback((node: HTMLAudioElement | null) => {
    remoteAudioRef.current = node;
    if (node && remoteStreamState) {
      node.srcObject = remoteStreamState;
      node.play().catch((e) => {
        console.warn("Autoplay audio bloqué par le navigateur:", e);
        const handleUserInteraction = () => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.play().catch(console.error);
          }
          window.removeEventListener("click", handleUserInteraction);
          window.removeEventListener("touchstart", handleUserInteraction);
        };
        window.addEventListener("click", handleUserInteraction);
        window.addEventListener("touchstart", handleUserInteraction);
      });
    }
  }, [remoteStreamState]);

  // Synchronisation des flux sur les éléments DOM au changement de flux distant
  useEffect(() => {
    if (remoteStreamState) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamState;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamState;
        remoteAudioRef.current.play().catch((e) => console.warn("Autoplay audio bloqué:", e));
      }
    }
  }, [remoteStreamState]);

  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const currentUserId = sessionUserId ?? AdminId;

  const notificationsCompter = useCallback(
    (senderId: number) => {
      if (typeof window === "undefined") return 0;
      const local = localStorage.getItem("storedNotificationsArray");
      const stored = local
        ? JSON.parse(local)
        : storedNotificationsArray || [];
      return stored.filter((item: any) => Number(item.senderId) === senderId)
        .length;
    },
    [storedNotificationsArray]
  );

  useEffect(() => {
    if (!currentUserId) return;
    setAdminId(currentUserId);

    const registerSocket = () => {
      socket.emit("register", currentUserId);
    };

    if (socket.connected) {
      registerSocket();
    }

    socket.on("connect", registerSocket);
    return () => {
      socket.off("connect", registerSocket);
    };
  }, [currentUserId]);

  const startCallTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopCallTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  function formatCallDuration(seconds: number) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
      hrs.toString().padStart(2, "0"),
      mins.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":");
  }

  const cleanupWebRTC = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    iceCandidatesQueue.current = [];

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }

    setLocalStreamState(null);
    setRemoteStreamState(null);

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
  }, []);

  const processIceCandidatesQueue = async () => {
    if (peerConnection.current && peerConnection.current.remoteDescription) {
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        if (candidate) {
          try {
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          } catch (err) {
            console.error("Erreur d'ajout ICE en attente :", err);
          }
        }
      }
    }
  };

  const initPeerConnection = useCallback((targetUserId: number) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", {
          candidate: event.candidate,
          to: targetUserId,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStreamState(event.streams[0]);
      } else {
        setRemoteStreamState((prev) => {
          const stream = prev || new MediaStream();
          stream.addTrack(event.track);
          return stream;
        });
      }
    };

    peerConnection.current = pc;
    return pc;
  }, []);

  const startCall = async (type: "audio" | "video") => {
    try {
      setIsCalling(true);
      setCallType(type);
      setCallStatus("ringing");
      setIsCallMinimized(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: type === "video" ? { width: 1280, height: 720 } : false,
      });

      localStream.current = stream;
      setLocalStreamState(stream);

      const pc = initPeerConnection(userData.UserId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("callUser", {
        to: userData.UserId,
        from: currentUserId,
        offer,
        type,
      });
    } catch (error) {
      console.error("Erreur initialisation appel :", error);
      endCall();
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      const isVideo = incomingCall.type === "video";
      setCallType(incomingCall.type || "audio");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: isVideo ? { width: 1280, height: 720 } : false,
      });

      localStream.current = stream;
      setLocalStreamState(stream);

      const pc = initPeerConnection(incomingCall.from);
      
      // AJOUT DES PISTES LOCALES AVANT LA REMOTE DESCRIPTION
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer)
      );

      await processIceCandidatesQueue();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answerCall", {
        to: incomingCall.from,
        answer,
      });

      setIsCalling(true);
      setCallAccepted(true);
      setCallStatus("accepted");
      setIsCallMinimized(false);
      startCallTimer();
    } catch (err) {
      console.error("Erreur acceptation appel :", err);
      rejectCall();
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      socket.emit("rejectCall", { to: incomingCall.from });
    }
    setIncomingCall(null);
    setCallStatus("rejected");
    setIsCalling(false);
    setIsCallMinimized(false);
    stopCallTimer();
    getData();
  };

  const endCall = () => {
    const targetId = userData.UserId || incomingCall?.from;
    if (targetId) {
      socket.emit("endCall", { to: targetId });
    }
    getData();
    cleanupWebRTC();
    stopCallTimer();
    setCallStatus("ended");
    setCallDuration(0);
    setCallAccepted(false);
    setIncomingCall(null);
    setIsCalling(false);
    setIsCallMinimized(false);
  };

  useEffect(() => {
    const handleIncomingCall = (data: any) => {
      if (Number(data.to) === Number(currentUserId)) {
        setCallType(data.type || "audio");
        setIncomingCall(data);
        setCallStatus("ringing");
        setIsCallMinimized(false);
      }
    };

    const handleCallAnswered = async (data: any) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        await processIceCandidatesQueue();

        setCallAccepted(true);
        setCallStatus("accepted");
        startCallTimer();
      }
    };

    const handleIceCandidate = async (data: any) => {
      if (data.candidate) {
        if (
          peerConnection.current &&
          peerConnection.current.remoteDescription
        ) {
          try {
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          } catch (err) {
            console.error("Erreur ICE Candidate :", err);
          }
        } else {
          iceCandidatesQueue.current.push(data.candidate);
        }
      }
    };

    const handleCallRejected = () => {
      setCallStatus("rejected");
      setIsCalling(false);
      setIsCallMinimized(false);
      cleanupWebRTC();
      stopCallTimer();
    };

    const handleCallEnded = () => {
      cleanupWebRTC();
      stopCallTimer();
      setCallStatus("ended");
      setCallDuration(0);
      setCallAccepted(false);
      setIncomingCall(null);
      setIsCalling(false);
      setIsCallMinimized(false);
    };

    const handleGetChatData = (datas: any) => {
      getData();
      if (datas.receiverId === String(currentUserId)) {
        const local = localStorage.getItem("storedNotificationsArray");
        const stored = local ? JSON.parse(local) : [];
        const count = [...stored, datas].filter(
          (item) => item.senderId === datas.senderId
        ).length;

        setNotificationCountLive({
          status: true,
          count,
          UserId: Number(datas.senderId),
        });
      }
    };

    const handleUsersOnline = (onlineIds: number[]) => {
      setUsersOnline(onlineIds);
    };

    socket.on("incomingCall", handleIncomingCall);
    socket.on("callAnswered", handleCallAnswered);
    socket.on("iceCandidate", handleIceCandidate);
    socket.on("callRejected", handleCallRejected);
    socket.on("callEnded", handleCallEnded);
    socket.on("getChatData", handleGetChatData);
    socket.on("usersOnline", handleUsersOnline);

    return () => {
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callAnswered", handleCallAnswered);
      socket.off("iceCandidate", handleIceCandidate);
      socket.off("callRejected", handleCallRejected);
      socket.off("callEnded", handleCallEnded);
      socket.off("getChatData", handleGetChatData);
      socket.off("usersOnline", handleUsersOnline);
    };
  }, [currentUserId, cleanupWebRTC, startCallTimer, stopCallTimer]);

  const getData = async () => {
    const usersFcmTokens = await providers.API.getAll(
      providers.APIUrl,
      "getFcmTokens",
      null
    );

    const filteredByEnterprise = usersFcmTokens.filter(
      (item: { UserEnterpriseId: number }) =>
        item.UserEnterpriseId === sessionEnterpriseId
    );

    const uniqueUsersMap = new Map<number, Users>();
    filteredByEnterprise.forEach((item: Users) => {
      if (!uniqueUsersMap.has(item.UserId)) {
        uniqueUsersMap.set(item.UserId, item);
      }
    });
    const uniqueUsers = Array.from(uniqueUsersMap.values());

    const messages = await providers.API.getAll(
      providers.APIUrl,
      "getChatMessage",
      null
    );
    const sortedUsers = sortUsersByFrequency(uniqueUsers, messages);

    setUsers(sortedUsers);
    setUsersCloned(sortedUsers);
    setChatMessage(messages);
    setLoader(false);
  };

  function sortUsersByFrequency(usersList: Users[], messages: ChatMessage[]) {
    const map = new Map();
    messages.forEach((msg) => {
      const time = new Date(msg.createdAt).getTime();
      if (msg.senderId)
        map.set(msg.senderId, Math.max(map.get(msg.senderId) || 0, time));
      if (msg.receiverId)
        map.set(msg.receiverId, Math.max(map.get(msg.receiverId) || 0, time));
    });

    return [...usersList].sort(
      (a, b) => (map.get(b.UserId) || 0) - (map.get(a.UserId) || 0)
    );
  }

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined" || !sessionEnterpriseId) return;
      getData();
    })();
  }, [sessionEnterpriseId]);

  async function sendChatMessage() {
    if (!data.content) {
      return providers.alertMessage(
        false,
        "Champ incorrect",
        "Veuillez saisir un contenu!",
        "/dashboard/NOTIF/chat"
      );
    }

    const newMessage: ChatMessage = {
      role: "Super-Admin",
      receiverId: userData.UserId,
      senderId: Number(currentUserId),
      content: data.content,
      file: data.files,
      createdAt: new Date().toISOString(),
      title: "",
    };

    setChatMessage((prev) => [...prev, newMessage]);

    const response = await providers.API.post(
      providers.APIUrl,
      "createChatMessage",
      null,
      {
        content: data.content,
        receiverId: userData.UserId,
        senderId: currentUserId,
        EnterpriseId: sessionEnterpriseId || 1,
        file: data.files,
        role: "Super-Admin",
      }
    );

    socket.emit("onSendChatData", {
      path: "/Dashboard/NOTIF/chat",
      adminSectionIndex: "0",
      adminPageIndex: "0",
      receiverId: [userData.UserId],
      senderId: String(currentUserId),
    });

    setData((prev) => ({ ...prev, content: "", files: "" }));

    if (response) {
      await providers.API.post(
        "https://vps118934.serveur-vps.net:4001",
        "sendNotificationPush",
        null,
        {
          path: "/dashboard/NOTIF/chat",
          EnterpriseId: userData.EnterpriseId.toString(),
          messagingType: "notification",
          adminSectionIndex: "0",
          adminPageIndex: "0",
          senderId: String(currentUserId),
          receiverId: String(userData.UserId),
        }
      );
    }
  }

  function removeNotificationCount(senderId: number) {
    socket.emit("onReadMessage", {
      senderId: senderId,
      receiverId: Number(currentUserId),
    });

    const local = localStorage.getItem("storedNotificationsArray");
    const stored = local ? JSON.parse(local) : [];
    const deleteItem = stored.filter(
      (item: any) => Number(item.senderId) !== senderId
    );

    setNotificationCountLive({ status: false, count: 0, UserId: 0 });
    localStorage.setItem(
      "storedNotificationsArray",
      JSON.stringify(deleteItem)
    );
  }

  function onSearch(value: string) {
    const searchUsers = users.filter(
      (item) =>
        item.User?.firstname.toLowerCase().includes(value.toLowerCase()) ||
        item.User?.lastname.toLowerCase().includes(value.toLowerCase())
    );
    const unique = Array.from(
      new Map(searchUsers.map((item) => [item.UserId, item])).values()
    );
    setUsersCloned(unique);
  }

  useEffect(() => {
    const socketData = (data: { senderId: number; receiverId: number }) => {
      const local = localStorage.getItem("storedNotificationsArray");
      const stored: { senderId: string; receiverId: string }[] = local
        ? JSON.parse(local)
        : [];
      const count = stored.filter(
        (item) =>
          Number(item.senderId) !== data.receiverId &&
          Number(item.receiverId) !== data.senderId
      );
      localStorage.setItem("storedNotificationsArray", JSON.stringify(count));
      setNotificationCountLive({
        status: false,
        count: count.length,
        UserId: Number(data.receiverId),
      });
      notificationsCompter(data.receiverId);
    };

    socket.on("removeNotificationsCount", socketData);
    return () => {
      socket.off("removeNotificationsCount", socketData);
    };
  }, [notificationsCompter]);

  return {
    users,
    userData,
    setUserData,
    sendChatMessage,
    data,
    setData,
    chatMessage,
    setChatMessage,
    removeNotificationCount,
    notificationsCompter,
    ref,
    usersCloned,
    setUsersCloned,
    onSearch,
    UserId: currentUserId,
    AdminId,
    loader,
    notificationsCountLive,
    startAudioCall: () => startCall("audio"),
    startVideoCall: () => startCall("video"),
    acceptCall,
    rejectCall,
    endCall,
    incomingCall,
    callAccepted,
    isCalling,
    localVideo: setLocalVideoRef,
    remoteVideo: setRemoteVideoRef,
    remoteAudio: setRemoteAudioRef,
    setLocalVideoRef,
    setRemoteVideoRef,
    setRemoteAudioRef,
    localStream: localStreamState,
    remoteStream: remoteStreamState,
    callType,
    setCallType,
    callStatus,
    callDuration,
    formatCallDuration,
    usersOnLine,
    isCallMinimized,
    setIsCallMinimized,
  };
}