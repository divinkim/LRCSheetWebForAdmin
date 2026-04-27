"use client";
import { providers } from "@/index";
import { useState, useEffect } from "react";
import SidebarHook from "@/components/Layouts/sidebar/hook";
import { useRef } from "react";
import { Ms_Madi } from "next/font/google";

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
    const [userData, setUserData] = useState({
        fcmToken: "",
        UserId: 0,
        email: "",
        lastname: "",
        EnterpriseId: 0,
        firstname: "",
        photo: "",
    });
    const ref = useRef<HTMLDivElement | null>(null);
    const [data, setData] = useState({
        content: "",
        fcmToken: "",
        receiverId: 0,
        senderId: 0,
        EnterpriseId: 0,
        files: "",
    })

    const [chatMessage, setChatMessage] = useState<ChatMessage[]>([]);

    function getNotificationCount(UserId: number) {
        const count = storedNotificationsArray.filter((item: { senderId: string }) => Number(item.senderId) === UserId);
        return count.length;
    }

    function removeNotificationCount(UserId: number) {
        const deleteItem = storedNotificationsArray.filter((item: { senderId: string, adminSectionIndex: string, adminPageIndex: string }) => Number(item.senderId) !== UserId && (Number(item.adminPageIndex) === 0 && Number(item.adminSectionIndex) === 0));
        setStoredNotificationsArray(deleteItem);
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
        (() => {
            if (ref.current) {
                ref.current.scrollIntoView({ behavior: "smooth" })
            }
            const newUsersArray = sortUsersByFrequency(users, chatMessage);
            setUsersCloned(newUsersArray)
        })();
    }, [chatMessage])

    useEffect(() => {
        (() => {
            if (ref.current) {
                ref.current.scrollIntoView({ behavior: "smooth" })
            }
        })()
    }, [userData.fcmToken])

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

        setData({
            ...data,
            content: "",
            files: ""
        })

        if (response) {
            const notification = await providers.API.post(providers.APIUrl, "sendNotificationToWebUser", null, {
                path: "/dashboard/NOTIF/chat",
                EnterpriseId: userData.EnterpriseId.toString(),
                messagingType: "notification",
                adminSectionIndex: 0,
                adminPageIndex: 0,
                senderId: AdminId,
                receiverId: userData.UserId
            });
            const sendMail = await providers.API.post(providers.APIUrl, "sendMail", null, {
                senderEmail: "lrcsheet@gmail.com",
                subject: "Notification entrante!",
                content: "Veuillez consulter votre messagerie au niveau de l'espace web LRCSheet",
                emails: [userData.email],
            })
            console.log(notification);
            console.log(sendMail)
        }


        if (response) {
            await providers.API.post(providers.APIUrl, "sendNotificationToWebUser", null, {
                path: "/dashboard/NOTIF/chat",
                EnterpriseId: userData.EnterpriseId.toString(),
                adminSectionIndex: 0,
                adminPageIndex: 0,
                senderId: AdminId?.toString()
            })
        }
    }

    function onSearch(value: string) {
        const searchUsers = users.filter(item => item.User.firstname.toLowerCase().includes(value.toLowerCase()) || item.User.lastname.toLowerCase().includes(value.toLowerCase()));
        setUsersCloned(searchUsers);
    }

    console.log("le tableau", storedNotificationsArray)

    return { users, userData, setUserData, sendChatMessage, data, setData, chatMessage, setChatMessage, getNotificationCount, removeNotificationCount, ref, usersCloned, setUsersCloned, onSearch, AdminId }
}