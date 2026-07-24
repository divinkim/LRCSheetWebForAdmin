"use client";

import { useMemo, useState, useEffect, KeyboardEvent } from "react";
import Link from "next/link";
import { ClipLoader } from "react-spinners";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMessage,
  faPaperclip,
  faPhone,
  faSearch,
  faTimes,
  faArrowLeft,
  faPaperPlane,
  faFolderOpen,
  faFileAlt,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";

import { providers } from "@/index";
import socket from "@/socket";
import { useSidebarContext } from "@/components/Layouts/sidebar/sidebar-context";
import { useChat } from "./hook";

type ChatMessage = {
  id?: number;
  role: string;
  receiverId: number;
  senderId: number;
  content: string;
  file?: string;
  createdAt: string;
  title?: string | null;
  callStatus?: boolean;
  callDuration?: number;
};

// Composant réutilisable pour les fenêtres modales d'appel
function CallModal({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex h-[380px] w-full max-w-[420px] flex-col items-center justify-center space-y-6 rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {title}
        </h2>
        <img
          src="/images/clientProfile.png"
          alt="Profil"
          className="h-28 w-28 rounded-full border-2 border-slate-200 object-cover shadow dark:border-slate-700"
        />
        <div className="flex items-center space-x-4">{children}</div>
      </div>
    </div>
  );
}

export default function Chat() {
  const {
    userData,
    setUserData,
    data,
    setData,
    sendChatMessage,
    chatMessage,
    removeNotificationCount,
    ref,
    usersCloned,
    onSearch,
    UserId,
    AdminId,
    loading,
    loader,
    notificationsCountLive,
    notificationsCompter,
    startAudioCall,
    acceptCall,
    incomingCall,
    callAccepted,
    endCall,
    remoteAudio,
    isCalling,
    localVideo,
    remoteVideo,
    startVideoCall,
    callType,
    setCallType,
    usersOnLine,
  } = useChat();

  const [showChat, setShowChat] = useState(false);
  const { isMobile } = useSidebarContext();

  const currentUserId = AdminId ?? UserId;

  // Défilement automatique vers le bas lors du changement d'utilisateur ou de message
  useEffect(() => {
    if (userData.UserId && ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [userData.UserId, chatMessage, ref]);

  // Optimisation du regroupement des messages par date
  const chatMessageGrouped = useMemo(() => {
    return chatMessage.reduce((acc, item) => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      const currentDate = new Date(item.createdAt);
      let dateLabel = "";

      if (today.toDateString() === currentDate.toDateString()) {
        dateLabel = "Aujourd'hui";
      } else if (yesterday.toDateString() === currentDate.toDateString()) {
        dateLabel = "Hier";
      } else {
        dateLabel = currentDate.toLocaleDateString([], {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }

      if (!acc[dateLabel]) {
        acc[dateLabel] = [];
      }
      acc[dateLabel].push(item);
      return acc;
    }, {} as Record<string, ChatMessage[]>);
  }, [chatMessage]);

  const getLatestChatMessage = (targetUserId: number) => {
    const message = chatMessage
      .filter(
        (item) =>
          (item.senderId === targetUserId && item.receiverId === currentUserId) ||
          (item.senderId === currentUserId && item.receiverId === targetUserId)
      )
      .at(-1);

    return {
      content: message?.content ?? "Laissez un message",
      date: message?.createdAt
        ? new Date(message.createdAt).toLocaleDateString([], {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    };
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (data.content?.trim() || data.files) {
        sendChatMessage();
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] max-h-[800px] min-h-[500px] w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {/* Flux Audio / Vidéo HTML5 cachés */}
      <audio ref={remoteAudio} autoPlay className="hidden" />

      {/* VISIO VIDEO EN PLEIN ÉCRAN */}
      {callType === "video" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <video
            ref={remoteVideo}
            autoPlay
            className="h-full w-full object-cover"
          />
          <video
            ref={localVideo}
            autoPlay
            muted
            className="absolute bottom-5 right-5 h-36 w-36 rounded-lg border-2 border-white object-cover shadow-lg"
          />
          <div className="absolute top-5 right-5">
            <button
              onClick={() => {
                endCall();
                setCallType("audio");
              }}
              className="rounded bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700"
            >
              Raccrocher
            </button>
          </div>
        </div>
      )}

      {/* MODALE : APPEL EN COURS */}
      {isCalling && !callAccepted && (
        <CallModal title="Appel en cours...">
          <button
            onClick={endCall}
            className="rounded-md bg-red-500 px-5 py-2 text-white transition hover:bg-red-600"
          >
            Annuler
          </button>
        </CallModal>
      )}

      {/* MODALE : APPEL ENTRANT */}
      {incomingCall && !callAccepted && (
        <CallModal title="Appel entrant...">
          <button
            onClick={acceptCall}
            className="rounded-md bg-green-500 px-5 py-2 text-white transition hover:bg-green-600"
          >
            Accepter
          </button>
          <button
            onClick={endCall}
            className="rounded-md bg-red-500 px-5 py-2 text-white transition hover:bg-red-600"
          >
            Refuser
          </button>
        </CallModal>
      )}

      {/* MODALE : APPEL AUDIO CONNECTÉ */}
      {callAccepted && callType !== "video" && (
        <CallModal title="Appel connecté...">
          <button
            onClick={endCall}
            className="rounded-md bg-red-500 px-5 py-2 text-white transition hover:bg-red-600"
          >
            Raccrocher
          </button>
        </CallModal>
      )}

      {/* Sidebar: Liste des Utilisateurs */}
      <div
        className={`flex flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 transition-all duration-300 ${
          isMobile && showChat
            ? "hidden"
            : isMobile && !showChat
            ? "w-full"
            : "w-full max-w-[360px] lg:max-w-[400px]"
        }`}
      >
        {/* En-tête Sidebar */}
        <header className="flex items-center justify-between border-b border-slate-200 p-4 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
          <h1 className="text-xl font-bold text-slate-700 dark:text-white">
            LRCSheet Chat
          </h1>
        </header>

        {/* Barre de Recherche */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <input
              type="text"
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Rechercher un collaborateur..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-amber-400"
            />
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-600 dark:text-slate-400"
            />
          </div>
        </div>

        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto">
          {usersCloned.length > 0 && !loading && !loader ? (
            usersCloned.map((item, index) => {
              if (item.UserId === currentUserId) return null;

              const isSelected = userData.UserId === item.UserId;
              const isOnline = usersOnLine.includes(item.UserId);
              const latestMsg = getLatestChatMessage(item.UserId);
              const unreadCount =
                notificationsCountLive?.status &&
                notificationsCountLive?.UserId === item.UserId
                  ? notificationsCountLive.count
                  : notificationsCompter(item.UserId);

              return (
                <div
                  key={item.UserId || index}
                  onClick={() => {
                    setUserData({
                      UserId: item.UserId,
                      fcmToken: item.fcmToken,
                      lastname: item.User?.lastname || "",
                      firstname: item.User?.firstname || "",
                      photo: String(item.User?.photo || ""),
                      email: item.User?.email || "",
                      EnterpriseId: item.UserEnterpriseId,
                    });
                    setData({
                      ...data,
                      receiverId: item.UserId,
                    });
                    setShowChat(true);
                    removeNotificationCount(item.UserId);
                    localStorage.setItem(
                      "receiverId",
                      JSON.stringify(item.UserId)
                    );
                    socket.emit("onReadMessage", {
                      senderId: item.UserId,
                      receiverId: Number(currentUserId),
                    });
                  }}
                  className={`flex items-center gap-3 border-b border-slate-100 p-3.5 cursor-pointer transition-colors dark:border-slate-700/60 ${
                    isSelected
                      ? "bg-blue-50/80 border-l-4 border-l-blue-600 dark:bg-slate-800 dark:border-l-amber-400"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {/* Avatar + Indicator en ligne */}
                  <div className="relative shrink-0">
                    <img
                      src={
                        item?.User?.photo
                          ? `${providers.APIUrl}/images/${item?.User?.photo}`
                          : "/images/clientProfile.png"
                      }
                      alt="Avatar"
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-transparent"
                    />
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${
                        isOnline
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                  </div>

                  {/* Infos Contact */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-sm font-semibold text-slate-700 truncate dark:text-slate-100">
                        {item?.User?.firstname}{" "}
                        {providers.reduceLengthOfText(
                          item?.User?.lastname,
                          12
                        )}
                      </h2>
                      {latestMsg.date && (
                        <span className="text-[11px] text-slate-600 shrink-0 dark:text-slate-400">
                          {latestMsg.date}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-600 truncate dark:text-slate-400">
                        {providers.reduceLengthOfText(
                          latestMsg.content.replace(/<[^>]*>/g, ""),
                          28
                        )}
                      </p>
                      {unreadCount > 0 && (
                        <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : loading || loader ? (
            <div className="flex h-64 items-center justify-center">
              <ClipLoader size={28} color="#2563eb" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <FontAwesomeIcon
                icon={faFolderOpen}
                className="text-4xl text-slate-600 mb-2"
              />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Aucun contact trouvé
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Box */}
      <div
        className={`flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-950/50 ${
          isMobile && !showChat ? "hidden" : "flex"
        }`}
      >
        {!userData.UserId ? (
          /* Empty State (Pas de conversation sélectionnée) */
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 rounded-full bg-blue-50 p-6 dark:bg-slate-800">
              <FontAwesomeIcon
                icon={faMessage}
                className="text-4xl text-blue-600 dark:text-amber-400"
              />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              Vos messages
            </h3>
            <p className="mt-1 text-sm text-slate-600 max-w-sm dark:text-slate-400">
              Sélectionnez un collaborateur dans la liste de gauche pour démarrer ou continuer une discussion.
            </p>
          </div>
        ) : (
          /* Fenêtre de Conversation Active */
          <div className="flex h-full flex-col">
            {/* Header Chat */}
            <header className="flex items-center justify-between border-b border-slate-200 bg-white p-3.5 shrink-0 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                {/* Back button (Mobile) */}
                <button
                  onClick={() => setShowChat(false)}
                  className="mr-1 rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
                </button>

                <div className="relative">
                  <img
                    src={
                      userData.photo
                        ? `${providers.APIUrl}/images/${userData.photo}`
                        : "/images/clientProfile.png"
                    }
                    alt="Profile"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <span
                    className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                      usersOnLine.includes(userData.UserId)
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-white">
                    {userData.firstname} {userData.lastname}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {usersOnLine.includes(userData.UserId)
                      ? "En ligne"
                      : "Hors ligne"}
                  </p>
                </div>
              </div>

              {/* Actions Header (Appels WebRTC) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={startAudioCall}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                  title="Lancer un appel audio"
                >
                  <FontAwesomeIcon icon={faPhone} className="text-sm" />
                </button>
                <button
                  onClick={startVideoCall}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                  title="Lancer un appel vidéo"
                >
                  <FontAwesomeIcon icon={faVideo} className="text-sm" />
                </button>
              </div>
            </header>

            {/* Zone des Messages (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {Object.keys(chatMessageGrouped).map((date) => {
                const isGroupVisible = chatMessageGrouped[date].some(
                  (item) =>
                    (item.senderId === currentUserId &&
                      item.receiverId === userData.UserId) ||
                    (item.senderId === userData.UserId &&
                      item.receiverId === currentUserId)
                );

                if (!isGroupVisible) return null;

                return (
                  <div key={date} className="space-y-4">
                    {/* Date Divider */}
                    <div className="flex items-center my-4">
                      <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
                      <span className="px-3 text-[11px] font-medium text-slate-600 bg-slate-100 rounded-full py-0.5 dark:bg-slate-800 dark:text-slate-400">
                        {date}
                      </span>
                      <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
                    </div>

                    {/* Messages du groupe */}
                    {chatMessageGrouped[date].map((chat, idx) => {
                      const isMe = chat.senderId === currentUserId;
                      const isOther = chat.senderId === userData.UserId;

                      if (!isMe && !isOther) return null;

                      return (
                        <div
                          key={chat.id || idx}
                          className={`flex ${
                            isMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                              isMe
                                ? "bg-blue-600 text-white rounded-br-none"
                                : "bg-white text-slate-700 rounded-bl-none border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
                            }`}
                          >
                            {chat.title && (
                              <p className="font-semibold text-sm mb-1">
                                {chat.title}
                              </p>
                            )}

                            {/* Bulle Texte */}
                            <div
                              className="leading-relaxed break-words [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-4"
                              dangerouslySetInnerHTML={{
                                __html: !chat.title && chat.content?.startsWith("<p>")
                                  ? chat.content
                                  : chat.content,
                              }}
                            />

                            {/* Fichier Joint */}
                            {chat.file && (
                              <div className="mt-2 pt-2 border-t border-white/20 dark:border-slate-700">
                                <a
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  href={`${providers.APIUrl}/images/${chat.file}`}
                                  className={`flex items-center gap-2 p-2 rounded-lg text-sm font-medium transition ${
                                    isMe
                                      ? "bg-blue-700 hover:bg-blue-800 text-white"
                                      : "bg-slate-50 hover:bg-slate-100 text-blue-600 dark:bg-slate-900 dark:text-amber-400"
                                  }`}
                                >
                                  <FontAwesomeIcon
                                    icon={faFileAlt}
                                    className="text-base"
                                  />
                                  <span className="truncate">
                                    Pièce jointe
                                  </span>
                                </a>
                              </div>
                            )}

                            {/* Statut d'appel */}
                            {chat.callStatus && (
                              <div className="flex items-center gap-1.5 mt-1.5 text-sm">
                                <FontAwesomeIcon
                                  icon={faPhone}
                                  className={
                                    chat.callStatus
                                      ? "text-amber-400"
                                      : "text-rose-400"
                                  }
                                />
                                <span>{chat.callDuration ?? 0}s</span>
                              </div>
                            )}

                            {/* Horodatage */}
                            <div
                              className={`mt-1 text-[10px] text-right ${
                                isMe
                                  ? "text-blue-100"
                                  : "text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {new Date(chat.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <div ref={ref} />
            </div>

            {/* Input Footer */}
            <footer className="p-3 bg-white border-t border-slate-200 shrink-0 dark:border-slate-700 dark:bg-slate-900">
              {/* Preview de fichier en cours d'envoi */}
              {data.files && (
                <div className="mb-2 flex items-center justify-between rounded-lg bg-blue-50 p-2 border border-blue-100 dark:bg-slate-800 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-amber-400">
                    <FontAwesomeIcon icon={faPaperclip} />
                    <span className="font-medium truncate">{data.files}</span>
                  </div>
                  <button
                    onClick={() => setData({ ...data, files: "" })}
                    className="text-slate-600 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2">
                <input
                  onChange={async (e) => {
                    const files = e.target.files?.[0];
                    if (!files) return;
                    const response = await providers.API.post(
                      providers.APIUrl,
                      "sendFiles",
                      null,
                      { files }
                    );
                    setData({
                      ...data,
                      files: response.filename,
                    });
                  }}
                  type="file"
                  id="fileUpload"
                  className="hidden"
                />

                {/* Bouton Pièce Jointe */}
                <label
                  htmlFor="fileUpload"
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  title="Joindre un fichier"
                >
                  <FontAwesomeIcon icon={faPaperclip} className="text-sm" />
                </label>

                {/* Champ Texte */}
                <div className="flex-1">
                  <textarea
                    value={data.content}
                    onChange={(e) =>
                      setData({ ...data, content: e.target.value })
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="Écrivez votre message..."
                    rows={1}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 placeholder-slate-600 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-amber-400"
                  />
                </div>

                {/* Bouton Envoyer */}
                <button
                  onClick={sendChatMessage}
                  disabled={!data.content?.trim() && !data.files}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                >
                  <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
                </button>
              </div>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}