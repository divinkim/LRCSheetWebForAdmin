"use client";

import { providers } from "@/index";
import { useState, useEffect, useRef, useCallback } from "react";
import { SidebarHook } from "@/components/Layouts/sidebar/hook";
import socket from "@/socket";
import { useSession } from "next-auth/react";
import { getDefaultHighWaterMark } from "stream";

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

    // ÉTATS ET REFS DÉDIÉS AUX FLUX MEDIA (WEBRTC)
    const [localStreamState, setLocalStreamState] = useState<MediaStream | null>(null);
    const [remoteStreamState, setRemoteStreamState] = useState<MediaStream | null>(null);

    // REFS SANS "| null" DANS LE GÉNÉRIQUE POUR COMPATIBILITÉ TS REACT
    const localVideo = useRef<HTMLVideoElement>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const remoteAudio = useRef<HTMLAudioElement>(null);

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStream = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const currentUserId = sessionUserId ?? AdminId;

    // ==========================================
    // CALCUL DES NOTIFICATIONS PAR UTILISATEUR
    // ==========================================
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

    // ==========================================
    // 1. ENREGISTREMENT AUTOMATIQUE DU SOCKET
    // ==========================================
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

    // ==========================================
    // 2. TIMERS & UTILITAIRES DE TEMPS
    // ==========================================
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

    // ==========================================
    // 3. WEBRTC ENGINE (Appels Audio & Vidéo)
    // ==========================================
    const cleanupWebRTC = useCallback(() => {
        peerConnection.current?.close();
        peerConnection.current = null;

        if (localStream.current) {
            localStream.current.getTracks().forEach((track) => track.stop());
            localStream.current = null;
        }

        setLocalStreamState(null);
        setRemoteStreamState(null);

        if (localVideo.current) localVideo.current.srcObject = null;
        if (remoteVideo.current) remoteVideo.current.srcObject = null;
        if (remoteAudio.current) remoteAudio.current.srcObject = null;
    }, []);

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
            const remoteStream = event.streams[0];
            setRemoteStreamState(remoteStream);

            if (remoteVideo.current) {
                remoteVideo.current.srcObject = remoteStream;
            }
            if (remoteAudio.current) {
                remoteAudio.current.srcObject = remoteStream;
                remoteAudio.current
                    .play()
                    .catch((err) => console.log("Erreur lecture audio distante :", err));
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

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: type === "video" ? { width: 1280, height: 720 } : false,
            });

            localStream.current = stream;
            setLocalStreamState(stream);

            if (type === "video" && localVideo.current) {
                localVideo.current.srcObject = stream;
            }

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
            console.error("Erreur lors de l'initialisation de l'appel :", error);
            endCall();
        }
    };

    const acceptCall = async () => {
        if (!incomingCall) return;

        try {
            const isVideo = incomingCall.type === "video";
            setCallType(incomingCall.type || "audio");

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: isVideo ? { width: 1280, height: 720 } : false,
            });

            localStream.current = stream;
            setLocalStreamState(stream);

            if (isVideo && localVideo.current) {
                localVideo.current.srcObject = stream;
            }

            const pc = initPeerConnection(incomingCall.from);
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));

            await pc.setRemoteDescription(
                new RTCSessionDescription(incomingCall.offer)
            );
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit("answerCall", {
                to: incomingCall.from,
                answer,
            });

            setIsCalling(true);
            setCallAccepted(true);
            setCallStatus("accepted");
            startCallTimer();
        } catch (err) {
            console.error("Erreur lors de l'acceptation de l'appel :", err);
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
        stopCallTimer();
        getData()
    };

    const endCall = () => {
        if (userData.UserId) {
            socket.emit("endCall", { to: userData.UserId });
        }
        getData()
        cleanupWebRTC();
        stopCallTimer();
        setCallStatus("ended");
        setCallDuration(0);
        setCallAccepted(false);
        setIncomingCall(null);
        setIsCalling(false);
    };

    // ==========================================
    // 4. LISTENERS WEBSOCKET TEMPS RÉEL
    // ==========================================
    useEffect(() => {
        const handleIncomingCall = (data: any) => {
            if (Number(data.to) === Number(currentUserId)) {
                setCallType(data.type || "audio");
                setIncomingCall(data);
                setCallStatus("ringing");
            }
        };

        const handleCallAnswered = async (data: any) => {
            if (peerConnection.current) {
                await peerConnection.current.setRemoteDescription(
                    new RTCSessionDescription(data.answer)
                );
                setCallAccepted(true);
                setCallStatus("accepted");
                startCallTimer();
            }
        };

        const handleIceCandidate = async (data: any) => {
            if (peerConnection.current && data.candidate) {
                try {
                    await peerConnection.current.addIceCandidate(
                        new RTCIceCandidate(data.candidate)
                    );
                } catch (err) {
                    console.error("Erreur ICE Candidate :", err);
                }
            }
        };

        const handleCallRejected = () => {
            setCallStatus("rejected");
            setIsCalling(false);
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
        };

        const handleGetChatData = (datas: any) => {
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

    // ==========================================
    // 5. FONCTIONS MESSAGERIE & RECHERCHE
    // ==========================================
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
    }

    useEffect(() => {
        (async () => {
            if (typeof window === "undefined" || !sessionEnterpriseId) return;

            getData()
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
        localVideo,
        remoteVideo,
        remoteAudio,
        localStream: localStreamState,
        remoteStream: remoteStreamState,
        callType,
        setCallType,
        callStatus,
        callDuration,
        formatCallDuration,
        usersOnLine,
    };
}