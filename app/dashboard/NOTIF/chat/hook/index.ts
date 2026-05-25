"use client";
import { providers } from "@/index";
import { useState, useEffect } from "react";
import SidebarHook from "@/components/Layouts/sidebar/hook";
import { useRef } from "react";
import socket from "@/socket";

type Users = {
    fcmToken: string,
    UserId: number,
    UserEnterpriseId: number,
    adminRole: string | null,
    User: {
        firstname: string,
        lastname: string,
        photo: string | null,
        email: string
    }
}

type ChatMessage = {
    role: string;
    receiverId: number;
    senderId: number;
    content: string;
    file: string;
    createdAt: string;
    title: string | null
};

export function useChat() {
    const [users, setUsers] = useState<Users[]>([]);
    const [usersCloned, setUsersCloned] = useState<Users[]>([]);
    const [AdminId, setAdminId] = useState<number | null>(null)
    const { storedNotificationsArray, setStoredNotificationsArray } = SidebarHook();
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
    })
    const [notificationsCountLive, setNotificationCountLive] = useState({
        status: false,
        count: 0,
        UserId: 0
    })
    const [chatMessage, setChatMessage] = useState<ChatMessage[]>([]);

    const [isCalling, setIsCalling] = useState(false);
    const [incomingCall, setIncomingCall] = useState<any>(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const localVideo = useRef<HTMLVideoElement | null>(null);
    const remoteVideo = useRef<HTMLVideoElement | null>(null);

    const [callType, setCallType] = useState<"audio" | "video">("audio");
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStream = useRef<MediaStream | null>(null);
    const remoteAudio = useRef<HTMLAudioElement | null>(null);

    // STATUS APPEL
    const [callStatus, setCallStatus] = useState<
        "idle" | "ringing" | "accepted" | "rejected" | "ended"
    >("idle");

    // DURÉE APPEL
    const [callDuration, setCallDuration] = useState(0);

    // TIMER
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // FORMAT TEMPS
    function formatCallDuration(seconds: number) {

        const hrs = Math.floor(seconds / 3600);

        const mins = Math.floor((seconds % 3600) / 60);

        const secs = seconds % 60;

        return [
            hrs.toString().padStart(2, "0"),
            mins.toString().padStart(2, "0"),
            secs.toString().padStart(2, "0")
        ].join(":");
    }

    // START TIMER
    function startCallTimer() {

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        timerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    }

    // STOP TIMER
    function stopCallTimer() {

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    }

    const startVideoCall = async () => {
        try {

            setIsCalling(true);
            setCallType("video");
            setCallStatus("ringing");


            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true
            });

            localStream.current = stream;

            // afficher ma vidéo
            if (localVideo.current) {
                localVideo.current.srcObject = stream;
            }

            const pc = new RTCPeerConnection({
                iceServers: [
                    {
                        urls: "stun:stun.l.google.com:19302"
                    }
                ]
            });

            peerConnection.current = pc;

            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            pc.ontrack = async (event) => {

                console.log("TRACK REÇU", event);

                const remoteStream = event.streams[0];

                if (remoteAudio.current) {

                    remoteAudio.current.srcObject = remoteStream;

                    remoteAudio.current.volume = 1;

                    remoteAudio.current.muted = false;

                    try {
                        await remoteAudio.current.play();
                        console.log("audio play ok");
                    } catch (err) {
                        console.log("play bloqué", err);
                    }
                }
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("iceCandidate", {
                        candidate: event.candidate,
                        to: userData.UserId
                    });
                }
            };

            const offer = await pc.createOffer();

            await pc.setLocalDescription(offer);

            socket.emit("callUser", {
                to: userData.UserId,
                from: AdminId,
                offer,
                type: "video"
            });

        } catch (error) {
            console.log(error);
        }
    };

    //Fonction pour lancer un appel
    const startAudioCall = async () => {
        try {

            setIsCalling(true);
            setCallStatus("ringing");

            // récupération micro
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            localStream.current = stream;

            // création connexion WebRTC
            const pc = new RTCPeerConnection({
                iceServers: [
                    {
                        urls: "stun:stun.l.google.com:19302"
                    }
                ]
            });

            peerConnection.current = pc;

            // ajouter audio
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // audio distant
            pc.ontrack = (event) => {
                if (remoteAudio.current) {
                    remoteAudio.current.srcObject = event.streams[0];
                }
            };

            // ICE candidate
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("iceCandidate", {
                        candidate: event.candidate,
                        to: userData.UserId
                    });
                }
            };

            // créer offre
            const offer = await pc.createOffer();

            await pc.setLocalDescription(offer);

            socket.emit("callUser", {
                to: userData.UserId,
                from: AdminId,
                offer
            });

        } catch (error) {
            console.log(error);
        }
    };

    //Fonction pour recevoir un appel
    socket.on("incomingCall", async (data) => {
        if (data.to === Number(AdminId)) {
            console.log("appel entrant", data)
            setCallType(data.type || "audio");
            setIncomingCall(data);
        }
    });

    const acceptCall = async () => {

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: callType === "video"
        });

        localStream.current = stream;

        if (callType === "video" && localVideo.current) {
            localVideo.current.srcObject = stream;
        }

        const pc = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302"
                }
            ]
        });

        peerConnection.current = pc;

        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {

            if (remoteAudio.current) {
                remoteAudio.current.srcObject = event.streams[0];
            }

            if (remoteVideo.current) {
                remoteVideo.current.srcObject = event.streams[0];
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("iceCandidate", {
                    candidate: event.candidate,
                    to: incomingCall.from
                });
            }
        };

        await pc.setRemoteDescription(
            new RTCSessionDescription(incomingCall.offer)
        );

        const answer = await pc.createAnswer();

        await pc.setLocalDescription(answer);

        socket.emit("answerCall", {
            to: incomingCall.from,
            answer
        });

        setIsCalling(true);
        setCallAccepted(true);
        setCallStatus("ringing");
    };

    //Réponse à l'appel
    useEffect(() => {
        socket.on("callAnswered", async (data) => {

            await peerConnection.current?.setRemoteDescription(
                new RTCSessionDescription(data.answer)
            );

            setCallAccepted(true);

            setCallStatus("accepted");

            setCallStatus("accepted");
            startCallTimer();
            startCallTimer();

        });

        return () => {
            socket.off("callAnswered");
        }

    }, []);

    //Appel réjeté
    useEffect(() => {

        socket.on("callRejected", () => {

            setCallStatus("rejected");

            setIsCalling(false);

            stopCallTimer();
        });

        return () => {
            socket.off("callRejected");
        };

    }, []);

    //
    useEffect(() => {
        socket.on("iceCandidate", async (data) => {
            try {

                await peerConnection.current?.addIceCandidate(
                    new RTCIceCandidate(data.candidate)
                );

            } catch (err) {
                console.log(err);
            }

        });

        return () => {
            socket.off("iceCandidate");
        }

    }, []);

    const rejectCall = () => {

        socket.emit("rejectCall", {
            to: incomingCall.from
        });

        setIncomingCall(null);

        setCallStatus("rejected");

        setIsCalling(false);

        stopCallTimer();
    };

    const endCall = () => {

        peerConnection.current?.close();

        localStream.current?.getTracks().forEach(track => {
            track.stop();
        });

        stopCallTimer();
        setCallStatus("ended");
        setCallDuration(0);

        setCallAccepted(false);
        setIncomingCall(null);
        setIsCalling(false);

        if (localVideo.current) {
            localVideo.current.srcObject = null;
        }

        if (remoteVideo.current) {
            remoteVideo.current.srcObject = null;
        }
    };

    function getNotificationCount(UserId: number) {
        const count = storedNotificationsArray.filter((item: { senderId: string }) => Number(item.senderId) === UserId);
        return count.length;
    }

    function removeNotificationCount(senderId: number) {
        const deleteItem = storedNotificationsArray.filter(item => Number(item.senderId) !== senderId && item.receiverId === Number(AdminId));

        console.log(deleteItem)

        setNotificationCountLive({
            status: false,
            count: 0,
            UserId: 0
        })
        localStorage.setItem("storedNotificationsArray", JSON.stringify(deleteItem))
    }
    function sortUsersByFrequency(users: Users[], messages: ChatMessage[]) {
        const map = new Map();
        messages.forEach((msg) => {
            const time = new Date(msg.createdAt).getTime();
            if (msg.senderId) {
                const prev = map.get(msg.senderId) || 0
                if (time > prev) {
                    map.set(msg.senderId, time)
                }
            }
            if (msg.receiverId) {
                const prev = map.get(msg.receiverId) || 0
                if (time > prev) {
                    map.set(msg.receiverId, time);
                }

            }
        });
        return [...users].sort((a, b) => {
            const countA = map.get(a.UserId) || 0;
            const countB = map.get(b.UserId) || 0;
            return countB - countA
        })
    }

    useEffect(() => {
        (async () => {
            if (typeof (window) === "undefined") return;
            if (ref.current) {
                ref.current.scrollIntoView({ behavior: "smooth" })
            }
            const EnterpriseId = localStorage.getItem("EnterpriseId");
            const AdminId = localStorage.getItem("id");

            const usersFcmTokens = await providers.API.getAll(providers.APIUrl, "getFcmTokens", null);
            const usersFcmTokensByEnterpriseId = usersFcmTokens.filter((item: { UserEnterpriseId: number }) => item.UserEnterpriseId === Number(EnterpriseId));

            const chatMessage = await providers.API.getAll(providers.APIUrl, "getChatMessage", null);

            const newUsersArray = sortUsersByFrequency(usersFcmTokensByEnterpriseId, chatMessage);

            setUsers(newUsersArray);
            setUsersCloned(newUsersArray);
            setChatMessage(chatMessage);
            setAdminId(Number(AdminId))
        })()
    }, []);

    useEffect(() => {
        (async () => {
            const chatMessage = await providers.API.getAll("https://vps118934.serveur-vps.net:4001", "getChatMessage", null);
            setChatMessage(chatMessage);
        })()
    }, [storedNotificationsArray])

    useEffect(() => {
        (() => {
            if (ref.current) {
                ref.current.scrollIntoView({ behavior: "smooth" })
            }
            const newUsersArray = sortUsersByFrequency(users, chatMessage);
            const unique = Array.from(
                new Map(newUsersArray.map(item => [item.UserId, item])).values()
            );
            setUsersCloned(unique);
        })();
    }, [chatMessage])

    useEffect(() => {
        (() => {
            if (ref.current) {
                ref.current.scrollIntoView({ behavior: "smooth" })
            }
        })()
    }, [userData.fcmToken])

    useEffect(() => {
        (() => {
            setLoader(false)
        })()
    }, [users])

    function onSearch(value: string) {
        const searchUsers = users.filter(item => item.User?.firstname.toLowerCase().includes(value.toLowerCase()) || item.User?.lastname.toLowerCase().includes(value.toLowerCase()));
        const unique = Array.from(
            new Map(searchUsers.map(item => [item.UserId, item])).values()
        );
        setUsersCloned(unique);
    }

    //Ecoute en temps réel des donnée du chat
    useEffect(() => {
        const handle = (datas: any) => {
            const UserId = localStorage.getItem("id")
            if (datas.receiverId === String(UserId)) {
                console.log(datas)

                const local = localStorage.getItem("storedNotificationsArray");
                const storedNotificationsArray = local ? JSON.parse(local) : [];

                const notificationCount = [...storedNotificationsArray, datas].filter(item => item.senderId === datas.senderId).length;

                setNotificationCountLive({
                    status: true,
                    count: notificationCount,
                    UserId: Number(datas.senderId)
                })

                // setStoredNotificationsArray([...storedNotificationsArray, datas])
                // localStorage.setItem("storedNotificationsArray", JSON.stringify([...storedNotificationsArray, datas]))
            }
        };

        socket.off("getChatData", handle);

        socket.on("getChatData", handle);

        return () => {
            socket.off("getChatData", handle)
        }
    }, [])

    useEffect(() => {
        const event = (data: number[]) => {
            console.log("utilisateurs connecté", data)
            setUsersOnline(data);
            return;
        }
        socket.off("usersOnline", event);
        socket.on("usersOnline", event);

        return () => {
            socket.off("usersOnline", event);
        }
    }, [])

    function notificationsCompter(UserId: number) {
        const result = storedNotificationsArray.filter(item => Number(item.senderId) === UserId);
        return result.length
    }

    async function sendChatMessage() {
        if (!data.content)
            return providers.alertMessage(false, "Champs incorrecte",
                "Veuillez saisir un contenu!",
                "/dashboard/NOTIF/chat"
            );

        setChatMessage(prevMessage => [
            ...prevMessage,
            {
                role: "Super-Admin",
                receiverId: userData.UserId,
                senderId: Number(AdminId),
                content: data.content,
                file: data.files,
                createdAt: new Date().toISOString(),
                title: ""
            }
        ]);

        const response = await providers.API.post(providers.APIUrl, "createChatMessage", null, {
            content: data.content,
            receiverId: userData.UserId,
            senderId: AdminId,
            EnterpriseId: 1,
            file: data.files,
            role: "Super-Admin",
        });

        socket.emit("onSendChatData", {
            path: "/Dashboard/NOTIF/chat",
            adminSectionIndex: "0",
            adminPageIndex: "0",
            receiverId: [userData.UserId],
            senderId: String(AdminId),
        })

        setData({
            ...data,
            content: "",
            files: ""
        })

        if (response) {
            const notification = await providers.API.post("https://vps118934.serveur-vps.net:4001", "sendNotificationPush", null, {
                path: "/dashboard/NOTIF/chat",
                EnterpriseId: userData.EnterpriseId.toString(),
                messagingType: "notification",
                adminSectionIndex: "0",
                adminPageIndex: "0",
                senderId: String(AdminId),
                receiverId: String(userData.UserId)
            });
            const sendMail = await providers.API.post("https://vps118934.serveur-vps.net:4001", "sendMail", null, {
                senderEmail: "lrcsheet@gmail.com",
                subject: "Notification entrante!",
                content: "Veuillez consulter votre messagerie au niveau de l'espace web LRCSheet",
                emails: [userData.email],
            })
            console.log(notification);
            console.log(sendMail)
        }
    }

    console.log("le tableau", storedNotificationsArray)
    // formatCallDuration(callDuration)

    return {
        users, userData, setUserData, sendChatMessage, data, setData, chatMessage, setChatMessage, getNotificationCount, removeNotificationCount, ref, usersCloned, setUsersCloned, onSearch, AdminId, loader, notificationsCountLive, notificationsCompter, startAudioCall, acceptCall, incomingCall, callAccepted, endCall, remoteAudio, isCalling, localVideo,
        remoteVideo,
        startVideoCall,
        callType, setIsCalling, setCallType,
        rejectCall,
        callStatus,
        callDuration,
        formatCallDuration,
        usersOnLine
    }
}