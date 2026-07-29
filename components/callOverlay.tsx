"use client";

import { useEffect } from "react";
import { CallModal } from "./callModal";

type CallOverlayProps = {
  isCalling: boolean;
  incomingCall: any;
  callAccepted: boolean;
  callType: "audio" | "video";
  userData: any;
  endCall: () => void;
  acceptCall: () => void;
  rejectCall: () => void;
  remoteAudio: React.RefObject<HTMLAudioElement>;
  remoteVideo: React.RefObject<HTMLVideoElement>;
  localVideo: React.RefObject<HTMLVideoElement>;
  setCallType: (type: "audio" | "video") => void;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  isCallMinimized?: boolean;
  setIsCallMinimized?: (val: boolean) => void;
  callDuration?: number;
  formatCallDuration?: (sec: number) => string;
};

export default function CallOverlay(props: CallOverlayProps) {
  const {
    isCalling,
    incomingCall,
    callAccepted,
    callType,
    userData,
    endCall,
    acceptCall,
    rejectCall,
    remoteAudio,
    remoteVideo,
    localVideo,
    setCallType,
    localStream,
    remoteStream,
    isCallMinimized = false,
    setIsCallMinimized,
    callDuration = 0,
    formatCallDuration,
  } = props;

  // 1. Synchronisation constante de l'audio distant
  useEffect(() => {
    if (remoteAudio?.current && remoteStream) {
      if (remoteAudio.current.srcObject !== remoteStream) {
        remoteAudio.current.srcObject = remoteStream;
      }
      remoteAudio.current
        .play()
        .catch((err) =>
          console.warn("Erreur lecture audio distant :", err)
        );
    }
  }, [remoteAudio, remoteStream, callAccepted]);

  // 2. Synchronisation constante des flux vidéo (Local & Distant)
  useEffect(() => {
    if (callType === "video" && callAccepted && !isCallMinimized) {
      if (remoteVideo?.current && remoteStream) {
        if (remoteVideo.current.srcObject !== remoteStream) {
          remoteVideo.current.srcObject = remoteStream;
        }
        remoteVideo.current
          .play()
          .catch((err) =>
            console.warn("Erreur lecture vidéo distante :", err)
          );
      }

      if (localVideo?.current && localStream) {
        if (localVideo.current.srcObject !== localStream) {
          localVideo.current.srcObject = localStream;
        }
        localVideo.current
          .play()
          .catch((err) =>
            console.warn("Erreur lecture vidéo locale :", err)
          );
      }
    }
  }, [
    callType,
    callAccepted,
    remoteStream,
    localStream,
    remoteVideo,
    localVideo,
    isCallMinimized,
  ]);

  const activeUserProfile = incomingCall?.callerProfile || userData;
  const isCallActive = callAccepted || isCalling;

  return (
    <>
      {/* Flux Audio distant TOUJOURS présent dans le DOM */}
      <audio ref={remoteAudio} autoPlay playsInline className="hidden" />

      {/* BANDEAU / BULLE "REVENIR À L'APPEL" (Si l'appel est réduit) */}
      {isCallActive && isCallMinimized && (
        <div className="fixed bottom-5 left-5 z-50 flex items-center gap-3 rounded-full bg-blue-600 px-4 py-3 text-white shadow-2xl animate-bounce">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <div className="text-xs">
            <p className="font-bold">Appel en cours...</p>
            {formatCallDuration && (
              <p className="text-[10px] opacity-90">
                {formatCallDuration(callDuration)}
              </p>
            )}
          </div>
          <button
            onClick={() => setIsCallMinimized && setIsCallMinimized(false)}
            className="ml-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-gray-100 transition shadow"
          >
            Revenir à l'appel
          </button>
          <button
            onClick={endCall}
            className="rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600 transition"
            title="Raccrocher"
          >
            ✕
          </button>
        </div>
      )}

      {/* OVERLAY APPEL VISUEL (Si NON réduit) */}
      {!isCallMinimized && (
        <>
          {/* VISIO VIDÉO PLEIN ÉCRAN */}
          {callType === "video" && callAccepted && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
              {/* Vidéo Distante */}
              <video
                ref={remoteVideo}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />

              {/* Vidéo Locale */}
              <video
                ref={localVideo}
                autoPlay
                playsInline
                muted
                className="absolute bottom-5 right-5 h-36 w-36 rounded-lg border-2 border-white object-cover shadow-lg z-10"
              />

              {/* Contrôles en haut */}
              <div className="absolute top-5 right-5 z-20 flex gap-3">
                <button
                  onClick={() =>
                    setIsCallMinimized && setIsCallMinimized(true)
                  }
                  className="rounded-lg bg-gray-800/80 px-4 py-2 font-medium text-white backdrop-blur hover:bg-gray-700 transition"
                >
                  Réduire / Bloquer pop-up
                </button>
                <button
                  onClick={() => {
                    endCall();
                    setCallType("audio");
                  }}
                  className="rounded-lg bg-red-600 px-5 py-2 font-medium text-white shadow-md hover:bg-red-700 transition"
                >
                  Raccrocher
                </button>
              </div>
            </div>
          )}

          {/* Appel en cours (Émetteur attend la réponse) */}
          {isCalling && !callAccepted && (
            <CallModal title="Appel en cours..." userProfile={userData}>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() =>
                    setIsCallMinimized && setIsCallMinimized(true)
                  }
                  className="rounded-lg bg-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-300 transition"
                >
                  Réduire
                </button>
                <button
                  onClick={endCall}
                  className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 transition"
                >
                  Annuler
                </button>
              </div>
            </CallModal>
          )}

          {/* Appel entrant (Le destinataire reçoit l'appel) */}
          {incomingCall && !callAccepted && (
            <CallModal
              title={`Appel ${
                incomingCall.type === "video" ||
                incomingCall.callType === "video"
                  ? "vidéo"
                  : "audio"
              } entrant...`}
              userProfile={activeUserProfile}
            >
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const type =
                      incomingCall.type || incomingCall.callType;
                    if (type) {
                      setCallType(type);
                    }
                    acceptCall();
                  }}
                  className="rounded-lg bg-green-500 px-5 py-2 text-white font-medium hover:bg-green-600 transition"
                >
                  Accepter
                </button>
                <button
                  onClick={rejectCall}
                  className="rounded-lg bg-red-500 px-5 py-2 text-white font-medium hover:bg-red-600 transition"
                >
                  Refuser
                </button>
              </div>
            </CallModal>
          )}

          {/* Appel Audio connecté */}
          {callAccepted && callType !== "video" && (
            <CallModal
              title="Appel audio en cours..."
              userProfile={activeUserProfile}
            >
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() =>
                    setIsCallMinimized && setIsCallMinimized(true)
                  }
                  className="rounded-lg bg-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-300 transition"
                >
                  Masquer le pop-up
                </button>
                <button
                  onClick={endCall}
                  className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 transition"
                >
                  Raccrocher
                </button>
              </div>
            </CallModal>
          )}
        </>
      )}
    </>
  );
}