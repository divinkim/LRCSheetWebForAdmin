'use client';
import { useToast } from '@/components/toast';
import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Phone,
  Video,
  Paperclip,
  Send,
  XCircle,
  ArrowLeft,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Volume2,
} from 'lucide-react';
import { useCollaboratorsChat } from './hook';
import { providers } from '@/index';
import { SidebarHook } from '@/components/Layouts/sidebar/hook';

interface CallState {
  isActive: boolean;
  type: 'audio' | 'video';
  isIncoming: boolean;
  partner: {
    id: number;
    firstname: string;
    lastname?: string;
    photo?: string;
  };
  status: 'calling' | 'connected' | 'incoming';
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const CollaboratorsSkeleton = () => {
  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-100">
      <div className="flex flex-col flex-1 bg-white max-w-md border-r border-slate-200">
        <div className="px-4 py-6 bg-slate-900 flex justify-between items-center shadow-md animate-pulse">
          <div className="h-6 w-32 bg-slate-800 rounded-md" />
          <div className="h-6 w-24 bg-slate-800 rounded-full" />
        </div>
        <div className="flex-1 px-4 py-2 space-y-4 overflow-y-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((key) => (
            <div key={key} className="flex items-center py-3.5 border-b border-slate-100 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-slate-200 mr-3 shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <div className="h-4 w-36 bg-slate-200 rounded-md" />
                  <div className="h-3 w-10 bg-slate-200 rounded-md" />
                </div>
                <div className="h-3 w-48 bg-slate-100 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function ChatPage() {
  const {
    collaborators,
    onlineUserIds,
    conversations,
    selectedCollaborator,
    selectCollaborator,
    messages,
    inputText,
    setInputText,
    selectedFile,
    setSelectedFile,
    sendMessage,
    socket,
    loader,
    currentUserId,
  } = useCollaboratorsChat();
  const { storedNotificationsArray, setStoredNotificationsArray } = SidebarHook();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef<boolean>(true);
  const toast = useToast()
  // Appels & WebRTC States
  const [callState, setCallState] = useState<CallState | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  // WebRTC Refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Signalisation temporaire
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // SCROLL
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (selectedCollaborator) {
      isAtBottomRef.current = true;
      scrollToBottom(false);
    }
  }, [selectedCollaborator]);

  useEffect(() => {
    if (messages.length > 0 && isAtBottomRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 50;
  };

  // Chronomètre de communication
  useEffect(() => {
    if (callState?.status === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState?.status]);

  // INITIALISATION ET ÉCOUTE WEBRTC / SOCKET
  useEffect(() => {
    if (!socket) return;

    socket.on('incomingCall', (data: any) => {
      incomingOfferRef.current = data.offer || null;
      setCallState({
        isActive: true,
        type: data.type || 'audio',
        isIncoming: true,
        status: 'incoming',
        partner: {
          id: data.from,
          firstname: data.callerProfile?.firstname || 'Collaborateur',
          lastname: data.callerProfile?.lastname || '',
          photo: data.callerProfile?.photo,
        },
      });
    });

    socket.on('callAnswered', async (data: { answer: RTCSessionDescriptionInit }) => {
      setCallState((prev) => (prev ? { ...prev, status: 'connected' } : null));
      if (pcRef.current && data.answer) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    socket.on('iceCandidate', async (data: { candidate: RTCIceCandidateInit }) => {
      try {
        if (pcRef.current && data.candidate) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (e) {
        console.error("Erreur lors de l'ajout du candidat ICE", e);
      }
    });

    socket.on('callRejected', () => handleEndCallLocal());
    socket.on('callEnded', () => handleEndCallLocal());

    return () => {
      socket.off('incomingCall');
      socket.off('callAnswered');
      socket.off('iceCandidate');
      socket.off('callRejected');
      socket.off('callEnded');
    };
  }, [socket]);

  const createPeerConnection = (targetUserId: number) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('iceCandidate', {
          to: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current?.addTrack(track);
      });

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    };

    pcRef.current = pc;
    return pc;
  };

  const triggerStartCall = async (type: 'audio' | 'video') => {
    if (!selectedCollaborator) return;

    setIsMuted(false);
    setIsVideoOff(false);
    setIsSpeakerOn(true);

    setCallState({
      isActive: true,
      type,
      isIncoming: false,
      status: 'calling',
      partner: {
        id: selectedCollaborator.id,
        firstname: selectedCollaborator.firstname,
        lastname: selectedCollaborator.lastname,
        photo: selectedCollaborator.photo,
      },
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection(selectedCollaborator.id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket?.emit('callUser', {
        to: selectedCollaborator.id,
        from: currentUserId,
        type,
        offer,
        callerProfile: {
          firstname: 'Mon Profil',
          lastname: '',
        },
      });
    } catch (err) {
      console.error('Erreur accès média (micro/caméra):', err);
      handleEndCallLocal();
    }
  };

  const acceptCall = async () => {
    if (!callState) return;

    try {
      const type = callState.type;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection(callState.partner.id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      if (incomingOfferRef.current) {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current));
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      setCallState((prev) => (prev ? { ...prev, status: 'connected' } : null));

      socket?.emit('answerCall', {
        to: callState.partner.id,
        answer,
      });
    } catch (err) {
      console.error("Erreur lors de l'acceptation de l'appel:", err);
      hangUpCall();
    }
  };

  const hangUpCall = () => {
    if (callState) {
      if (callState.status === 'incoming') {
        socket?.emit('rejectCall', { to: callState.partner.id, from: currentUserId });
      } else {
        socket?.emit('endCall', { to: callState.partner.id, from: currentUserId });
      }
    }
    handleEndCallLocal();
  };

  const handleEndCallLocal = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    incomingOfferRef.current = null;
    setCallState(null);
    setCallDuration(0);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = isSpeakerOn;
      setIsSpeakerOn(!isSpeakerOn);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isUserOnline = (id: number) => {
    return Array.isArray(onlineUserIds) && onlineUserIds.includes(id);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;
    sendMessage();
    isAtBottomRef.current = true;
    setTimeout(() => scrollToBottom(true), 50);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile({
        uri: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
        size: file.size,
        file: file,
      } as any);
    }
  };

  const containsHtml = (text: string) => /<[a-z][\s\S]*>/i.test(text);

  const formatMessageTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  };

  // Formate l'heure exacte HH:mm
  const formatMessageHour = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Regroupement des messages par Date (Aujourd'hui, Hier, ou Date exacte)
  const groupMessagesByDate = (msgList: any[]) => {
    const groups: { [key: string]: any[] } = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;

    msgList.forEach((msg) => {
      const msgDate = msg.createdAt ? new Date(msg.createdAt) : new Date();
      const msgDayTimestamp = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate()).getTime();

      let label = '';
      if (msgDayTimestamp === today) {
        label = "Aujourd'hui";
      } else if (msgDayTimestamp === yesterday) {
        label = 'Hier';
      } else {
        label = msgDate.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(msg);
    });

    return groups;
  };

  const renderLastMessageOrStatus = (collabId: number) => {
    const online = isUserOnline(collabId);
    const convState = conversations[collabId];

    if (convState && convState.lastMessage) {
      const cleanContent = convState.lastMessage.replace(/<[^>]*>?/gm, '');
      return {
        text: cleanContent,
        time: formatMessageTime(convState.lastMessageDate),
      };
    }

    return {
      text: online ? 'Disponible pour discuter' : 'Hors ligne',
      time: online ? 'en ligne' : '',
    };
  };

  function getNotificationCount(userId: number) {
    const count = storedNotificationsArray.filter(
      (item) => Number(item.senderId) === userId && item.messagingType === 'chat'
    );
    return count.length;
  }

  function removeNoticationCount(userId: number) {
    const notifications = storedNotificationsArray.filter(
      (item) => Number(item.senderId) !== userId && item.messagingType === 'chat'
    );
    setStoredNotificationsArray(notifications);
    localStorage.setItem('storedNotificationsArray', JSON.stringify(notifications));
  }

  if (loader) {
    return <CollaboratorsSkeleton />;
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex h-[640px] w-full dark:bg-slate-900 overflow-hidden font-sans relative">
      <audio
        ref={(el) => {
          if (el && remoteStreamRef.current && callState?.type === 'audio') el.srcObject = remoteStreamRef.current;
        }}
        autoPlay
      />

      <div className="flex w-full h-full bg-slate-100 overflow-hidden">
        {/* SIDEBAR COLLABORATEURS */}
        <div
          className={`${selectedCollaborator ? 'hidden md:flex' : 'flex'
            } w-full md:w-80 lg:w-96 flex-col bg-white border-r border-slate-200 shrink-0 h-full`}
        >
          <div className="px-4 py-5 bg-slate-900 flex justify-between items-center shadow-md">
            <h1 className="text-xl font-bold text-white tracking-wide">Discussions</h1>
            <span className="bg-amber-500 px-3 py-1 rounded-full text-xs font-bold text-slate-900">
              LRCSheet Pro
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {collaborators.map((item) => {
              const online = isUserOnline(item.id);
              const statusData = renderLastMessageOrStatus(item.id);
              const isSelected = selectedCollaborator?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    selectCollaborator(item);
                    removeNoticationCount(item.id);
                  }}
                  className={`w-full text-left flex items-center px-4 py-3.5 transition-colors ${isSelected ? 'bg-slate-100' : 'hover:bg-slate-50 bg-white'
                    }`}
                >
                  <div className="relative shrink-0">
                    {item.photo ? (
                      <img
                        src={`${providers.APIUrl}/images/${item.photo}`}
                        alt={item.firstname}
                        className="w-12 h-12 rounded-full object-cover bg-slate-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex justify-center items-center">
                        <User className="w-5 h-5 text-slate-500" />
                      </div>
                    )}
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${online ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                    />
                  </div>

                  <div className="flex-1 ml-3 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-800 truncate">
                        {item.firstname} {item.lastname || ''}
                      </span>
                      <span className="text-xs text-slate-400 font-medium shrink-0 ml-1">
                        {statusData.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {statusData.text}
                      </p>
                      <p
                        className={`${getNotificationCount(item.id) === 0 ? 'hidden' : 'block'
                          } bg-red-500 text-xs text-white rounded-full py-1 px-2.5`}
                      >
                        {getNotificationCount(item.id)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ZONE DE CHAT */}
        {selectedCollaborator ? (
          <div className="flex-1 flex flex-col h-full bg-slate-100 min-w-0">
            <div className="px-4 py-3 bg-slate-900 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center min-w-0">
                <button
                  onClick={() => selectCollaborator(null as any)}
                  className="p-1.5 mr-2 rounded-full hover:bg-slate-800 text-white md:hidden"
                  title="Retour"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {selectedCollaborator.photo ? (
                  <img
                    src={`${providers.APIUrl}/images/${selectedCollaborator.photo}`}
                    alt={selectedCollaborator.firstname}
                    className="w-10 h-10 rounded-full object-cover mr-3 bg-slate-800 border border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex justify-center items-center mr-3 shrink-0">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                )}

                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-white truncate">
                    {selectedCollaborator.firstname} {selectedCollaborator.lastname || ''}
                  </h2>
                  <p className="text-xs text-amber-400 font-medium">
                    {isUserOnline(selectedCollaborator.id) ? 'en ligne' : 'hors ligne'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => {
                    return toast.info("Infos", "ce service est momentanement indisponible")
                    triggerStartCall('audio')
                  }}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors"
                  title="Appel Audio"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    return toast.info("Infos", "ce service est momentanement indisponible")
                    triggerStartCall('video')
                  }}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                  title="Appel Vidéo"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* MESSAGES GROUPÉS PAR DATE */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 p-4 overflow-y-auto space-y-4"
            >
              {Object.keys(groupedMessages).map((dateLabel) => (
                <div key={dateLabel} className="space-y-3">
                  {/* Séparateur Date */}
                  <div className="flex justify-center my-3">
                    <span className="bg-slate-200 text-slate-600 text-[11px] font-semibold px-3 py-1 rounded-full shadow-xs">
                      {dateLabel}
                    </span>
                  </div>

                  {/* Messages du groupe */}
                  {groupedMessages[dateLabel].map((item) => {
                    const isMe = item.senderId === currentUserId;
                    const isHtmlMessage = containsHtml(item.content);
                    const formattedHour = formatMessageHour(item.createdAt);

                    return (
                      <div
                        key={item.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-xs ${isMe
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white text-slate-700 rounded-tl-none border border-slate-200'
                            }`}
                        >
                          {isHtmlMessage ? (
                            <div
                              className="prose prose-sm max-w-none dark:prose-invert"
                              dangerouslySetInnerHTML={{ __html: item.content }}
                            />
                          ) : (
                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                              {item.content}
                            </p>
                          )}
                          <div
                            className={`text-[10px] mt-1 text-right font-medium ${isMe ? 'text-blue-100' : 'text-slate-400'
                              }`}
                          >
                            {formattedHour}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* APERÇU FICHIER */}
            {selectedFile && (
              <div className="px-4 py-2 bg-amber-50 flex items-center justify-between border-t border-amber-200 shrink-0">
                <div className="flex items-center truncate mr-2">
                  <Paperclip className="w-4 h-4 text-amber-600 mr-2 shrink-0" />
                  <span className="text-xs text-slate-700 font-medium truncate">
                    {selectedFile.name}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* FORMULAIRE SAISIE */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-white flex items-center space-x-2 border-t border-slate-200 shrink-0"
            >
              <div className="flex-1 bg-slate-100 flex items-center rounded-full px-3 py-1.5 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 text-slate-500 hover:text-slate-700 rounded-full"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Message..."
                  className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 px-2 text-sm focus:outline-none"
                />
              </div>

              <button disabled={!inputText}
                type="submit"
                className={`${!inputText ? "opacity-50" : "opacity-100"} bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 rounded-full flex justify-center items-center shadow-md transition-colors shrink-0`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 justify-center items-center dark:bg-slate-50 text-slate-400">
            Sélectionnez une discussion pour commencer à échanger.
          </div>
        )}
      </div>

      {/* MODALE WEBRTC D'APPEL AUDIO & VIDÉO */}
      {callState?.isActive && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col justify-between items-center p-6 backdrop-blur-sm">
          {/* Header Appel */}
          <div className="flex flex-col items-center mt-4 z-10">
            <div className="flex items-center bg-slate-900 px-4 py-1.5 rounded-full mb-2 border border-slate-800 space-x-2">
              {callState.type === 'video' ? (
                <Video className="w-4 h-4 text-blue-500" />
              ) : (
                <Phone className="w-4 h-4 text-blue-500" />
              )}
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">
                Appel {callState.type}
              </span>
            </div>

            <p className="text-xs text-slate-400 font-medium">
              {callState.status === 'calling' && 'Sonne...'}
              {callState.status === 'incoming' && 'Appel entrant...'}
              {callState.status === 'connected' && formatTimer(callDuration)}
            </p>
          </div>

          {/* ZONE AFFICHAGE FLUX */}
          <div className="relative w-full max-w-2xl flex-1 flex justify-center items-center my-4 overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
            {callState.type === 'video' && callState.status === 'connected' ? (
              <>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                <div className="absolute bottom-4 right-4 w-32 h-44 bg-slate-950 rounded-xl overflow-hidden border-2 border-blue-500 shadow-lg">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center">
                {callState.partner.photo ? (
                  <img
                    src={`${providers.APIUrl}/images/${callState.partner.photo}`}
                    alt={callState.partner.firstname}
                    className="w-32 h-32 rounded-full border-4 border-blue-600 shadow-2xl object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-slate-900 border-4 border-blue-600 flex justify-center items-center shadow-2xl">
                    <User className="w-16 h-16 text-slate-500" />
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white mt-5 text-center">
                  {callState.partner.firstname} {callState.partner.lastname || ''}
                </h3>
              </div>
            )}
          </div>

          {/* COMMANDES DE L'APPEL */}
          <div className="w-full max-w-sm mb-6 z-10">
            {callState.status === 'incoming' ? (
              <div className="flex justify-around items-center">
                <button
                  onClick={hangUpCall}
                  className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex justify-center items-center shadow-lg transition-transform hover:scale-105"
                >
                  <Phone className="w-7 h-7 rotate-[135deg]" />
                </button>
                <button
                  onClick={acceptCall}
                  className="w-16 h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex justify-center items-center shadow-lg transition-transform hover:scale-105"
                >
                  <Phone className="w-7 h-7" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-6 items-center">
                <div className="flex justify-around items-center w-full bg-slate-900/90 p-4 rounded-3xl border border-slate-800">
                  <button
                    onClick={toggleMute}
                    className={`w-12 h-12 rounded-full flex justify-center items-center transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
                      }`}
                    title={isMuted ? 'Activer le micro' : 'Casser le micro'}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {callState.type === 'video' && (
                    <button
                      onClick={toggleVideo}
                      className={`w-12 h-12 rounded-full flex justify-center items-center transition-colors ${isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
                        }`}
                      title={isVideoOff ? 'Activer la caméra' : 'Désactiver la caméra'}
                    >
                      {isVideoOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                    </button>
                  )}

                  <button
                    onClick={toggleSpeaker}
                    className={`w-12 h-12 rounded-full flex justify-center items-center transition-colors ${isSpeakerOn ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
                      }`}
                    title={isSpeakerOn ? 'Désactiver le son' : 'Activer le son'}
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={hangUpCall}
                  className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex justify-center items-center shadow-xl transition-transform hover:scale-105"
                  title="Raccrocher"
                >
                  <Phone className="w-7 h-7 rotate-[135deg]" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}