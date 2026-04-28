"use client";
import { providers } from "@/index";
import { useChat } from "./hook";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMessage, faPaperclip, faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useSidebarContext } from "@/components/Layouts/sidebar/sidebar-context";
import { useState } from "react";
import { ClipLoader } from "react-spinners";
type ChatMessage = {
    role: string;
    receiverId: number;
    senderId: number;
    content: string;
    file: string;
    createdAt: string;
    title: string | null
};

export default function Chat() {

    const { users, userData, setUserData, data, setData, sendChatMessage, chatMessage, setChatMessage, getNotificationCount, removeNotificationCount, ref, usersCloned, setUsersCloned, onSearch, AdminId } = useChat();
    const [showChat, setShowChat] = useState(false)
    const { isMobile } = useSidebarContext()
    const chatMessageGrouped: Record<string, ChatMessage[]> = chatMessage.reduce((acc, item) => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const currentDate = new Date(item.createdAt)

        let date = "";

        if (today.toDateString() === currentDate.toDateString()) {
            date = "Aujourd'hui"
        } else if (yesterday.toDateString() === currentDate.toDateString()) {
            date = "Hier"
        } else {
            date = currentDate.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })
        }

        if (!acc[date]) {
            acc[date] = []
        }

        acc[date].push(item);

        return acc;

    }, {} as Record<string, ChatMessage[]>)

    const getLatestChatMessage = (UserId: number) => {
        const message = chatMessage.filter(item => (item.senderId === UserId &&
            item.receiverId === AdminId) || (item.senderId === AdminId && item.receiverId === UserId)
        ).at(-1);

        return {
            content: message?.content ?? "Laissez un message",
            date: message?.createdAt ? new Date(message?.createdAt).toLocaleDateString([], {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }) : ""
        }
    }

    return (
        <div className="flex h-[626px] overflow-hidden">
            <div className={` bg-white border-r border-gray-300 dark:border-gray-800 dark:bg-gray-900 overflow-y-auto pb-10 ${isMobile && !showChat ? "w-full" : isMobile && showChat ? "hidden" : "w-[35%]"}`}>
                <header className="p-4 border-b border-gray-300 flex justify-between items-center bg-gray-900 dark:border dark:border-gray-800  text-white">
                    <h1 className="text-2xl text-white font-semibold">LRCSheet Chat</h1>
                </header>

                <div className="h-full mb-9  dark:bg-gray-900">
                    <div className="relative w-full px-2 ">
                        <div className="w-full">
                            <input type="text" onChange={(e) => {
                                onSearch(e.target.value)
                            }} className="border outline-none w-full border-gray-300 bg-white my-3 rounded-md dark:border-gray-600 dark:bg-transparent p-3" placeholder="Recherche" />
                        </div>

                        <div className="absolute top-6 right-5">
                            <FontAwesomeIcon icon={faSearch} className="text-gray-600" />
                        </div>
                    </div>

                    {
                        users.length > 0 ?
                            usersCloned.map((item, index) => (
                                <div key={index} onClick={() => {
                                    setUserData({
                                        UserId: item.UserId,
                                        fcmToken: item.fcmToken,
                                        EnterpriseId: item.UserEnterpriseId,
                                        email: item.User.email,
                                        lastname: item.User.lastname,
                                        firstname: item.User.firstname,
                                        photo: String(item.User.photo)
                                    })
                                    setData({
                                        ...data,
                                        receiverId: item.UserId
                                    })
                                    setShowChat(true);
                                    removeNotificationCount(item.UserId)
                                }} className={item.UserId !== AdminId ? "flex items-center p-3 cursor-pointer hover:bg-gray-100 dark:hover dark:hover:bg-gray-800/50 ease duration-500   border-b border-gray-300 dark:border-gray-800" : "hidden"}>

                                    <div className="w-12 h-12 bg-gray-300 rounded-full mr-3">
                                        <img
                                            src={item?.User?.photo ? `${providers.APIUrl}/images/${item?.User?.photo}` : "/images/clientProfile.png"}
                                            alt="User Avatar"
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-md font-semibold">{item?.User?.firstname} {providers.reduceLengthOfText(item?.User?.lastname, 7)}</h2>
                                        <div className="flex flex-row justify-between items-center">
                                            <p className="text-gray-600 text-[14px]">{providers.reduceLengthOfText(getLatestChatMessage(item?.UserId).content, 10)}</p>
                                            <p className={getNotificationCount(item?.UserId) === 0 ? "hidden" : "bg-red-500 text-white py-0.5 px-2.5 text-[12px] rounded-full"}>
                                                {getNotificationCount(item?.UserId)}
                                            </p>
                                            <p className="text-gray-600 text-[12px]">{getLatestChatMessage(item?.UserId).date}</p>
                                        </div>
                                    </div>
                                </div>
                            )) :
                            <div className="w-full h-[500px] items-center flex justify-center">
                                <ClipLoader size={30} color="#1d4ed8" />
                            </div>
                    }
                </div>
            </div>

            <div className={`w-full ${isMobile && !showChat ? "hidden" : "w-full"}`}>
                {
                    !userData.fcmToken && (
                        <div className="w-full flex items-center justify-center h-full">
                            <div>
                                <div>
                                    <h1 className="text-gray-600 dark:text-gray-300">Laissez un message à un des collaborateurs</h1>
                                </div>
                                <div className="mx-auto w-[30px]">
                                    <FontAwesomeIcon icon={faMessage} className="text-[30px] text-gray-600  text-center" />
                                </div>
                            </div>
                        </div>
                    )

                }
                {
                    userData.fcmToken && (
                        <div className="w-full h-full relative">
                            <header className="bg-white dark:bg-gray-900  border-b border-gray-300 dark:border-gray-800 p-4 text-gray-700">
                                <div className="flex flex-row items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <img className="w-10 h-10 rounded-full object-cover" src={userData.photo ? `${providers.APIUrl}/images/${userData.photo}` : "/images/clientProfile.png"} />
                                        <h1 className="text-xl dark:text-gray-300 font-semibold">{userData.firstname} {providers.reduceLengthOfText(userData.lastname, 7)}</h1>
                                    </div>
                                    <div className="lg:hidden" onClick={() => {
                                        setShowChat(false)
                                    }}>
                                        <FontAwesomeIcon icon={faTimes} className="text-gray-600" />
                                    </div>
                                </div>
                            </header>

                            <div className="h-[500px] pb-32 lg:pb-20 overflow-y-auto px-4 pt-4">
                                {
                                    Object.keys(chatMessageGrouped).map((date, index) => (
                                        <div>
                                            <div className={`mb-5 flex flex-row space-x-3 justify-between items-center ${chatMessageGrouped[date].some(item => item.receiverId === userData.UserId || item.senderId === userData.UserId) ? "block" : "hidden"}`}>
                                                <div className="h-[0.5px] border w-1/2 border-gray-300 dark:border-gray-800"></div>
                                                <div>
                                                    <p className="text-gray-600 text-sm font-semibold dark:text-gray-300">{date}
                                                    </p>
                                                </div>
                                                <div className="h-[1px] border w-1/2 border-gray-300 dark:border-gray-800"></div>
                                            </div>
                                            {
                                                chatMessageGrouped[date].map((chat, i) => (
                                                    <div className={`flex mb-4 ${chat.receiverId === userData.UserId && chat.role === "Super-Admin" && chat.senderId === AdminId ? "justify-end" : chat.role === "client" && chat.senderId === userData.UserId && chat.receiverId === AdminId ? "justify-start " : "hidden"}`}>
                                                        {/* <div className="w-9 h-9 mr-2">
                                                            <img
                                                                src="/images/adminProfile.png"
                                                                alt="User Avatar"
                                                                className="w-8 h-8 rounded-full"
                                                            />
                                                        </div> */}
                                                        <div className={`p-3 rounded-lg dark:bg-gray-800 ${chat.role === "client" && chat.senderId === userData.UserId ? "bg-gray-800 text-white dark:bg-gray-900 dar:border dark:border-gray-800 dark:text-gray-300 " : chat.receiverId === userData.UserId && chat.role === "Super-Admin" ? "bg-gray-200" : ""}`}>
                                                            {
                                                                chat.title && (
                                                                    <p className="font-semibold mb-4">{chat.title}</p>
                                                                )
                                                            }
                                                            <p className="whitespace-pre-line">{chat.content}</p>
                                                            {
                                                                chat.file && (
                                                                    <div className="flex justify-end mt-4">
                                                                        <Link href={`${providers.APIUrl}/images/${chat.file}`} className="cursor-pointer ease duration-500 hover:scale-105">
                                                                            <img src="/images/folder.png" alt="" className="w-10 h-10 rounded-md relative left-6" />
                                                                            <p className="underline text-blue-700">Fichier joint</p>
                                                                        </Link>
                                                                    </div>
                                                                )
                                                            }
                                                            <div className="flex flex-end mt-4">
                                                                <p>{new Date(chat.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </div>

                                    ))
                                }
                                <div ref={ref} />
                            </div>

                            <footer className="bg-white  dark:bg-gray-900 w-full border-t border-gray-300 dark:border-gray-800 p-4 absolute bottom-0">
                                <div className="flex flex-col lg:flex-row items-center space-x-0 space-y-4  lg:space-x-4 lg:space-y-0">

                                    {/* Textarea */}
                                    <div className="relative w-full">
                                        <textarea value={data.content}
                                            onChange={(e) => {
                                                const value = e.target.value
                                                setData({
                                                    ...data,
                                                    content: value
                                                });
                                            }}
                                            placeholder="Saisissez un contenu..."
                                            className="py-3 pl-3 pr-10 rounded-md w-full border border-gray-300 bg-white dark:bg-gray-900 dark:border-gray-800 focus:outline-none"
                                        />
                                        {
                                            data.files && userData.UserId === data.receiverId && (
                                                <div className="absolute  top-4 right-4">
                                                    <img src="/images/folder.png" className="w-10 h-10" alt="" />
                                                </div>
                                            )
                                        }
                                    </div>

                                    <div className="flex flex-row space-x-4">
                                        <input onChange={async (e) => {
                                            const files = e.target.files?.[0];
                                            const response = await providers.API.post(providers.APIUrl, "sendFiles", null, { files });

                                            setData({
                                                ...data,
                                                files: response.filename
                                            })
                                        }}
                                            type="file"
                                            id="fileUpload"
                                            className="hidden"
                                        />

                                        {/* Bouton pièce jointe */}
                                        <label
                                            htmlFor="fileUpload"
                                            className="cursor-pointer p-3 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                                        >
                                            <FontAwesomeIcon icon={faPaperclip} className="text-gray-600 dark:text-gray-300" />
                                        </label>
                                        <button
                                            onClick={sendChatMessage}
                                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-md transition"
                                        >
                                            Envoyer
                                        </button>
                                    </div>

                                </div>
                            </footer>
                        </div>
                    )
                }

            </div>
        </div>
    );
}