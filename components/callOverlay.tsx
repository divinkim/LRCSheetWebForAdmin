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
  remoteAudio: React.RefObject<HTMLAudioElement | null>;
  remoteVideo: React.RefObject<HTMLVideoElement | null>;
  localVideo: React.RefObject<HTMLVideoElement | null>;
  setCallType: (type: "audio" | "video") => void;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
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
  } = props;

  // Forcer la synchronisation des flux vidéo vers les balises HTML <video>
  useEffect(() => {
    if (callType === "video" && callAccepted) {
      if (remoteVideo?.current && remoteStream) {
        remoteVideo.current.srcObject = remoteStream;
        remoteVideo.current.play().catch((err) =>
          console.warn("Erreur de lecture de la vidéo distante :", err)
        );
      }

      if (localVideo?.current && localStream) {
        localVideo.current.srcObject = localStream;
        localVideo.current.play().catch((err) =>
          console.warn("Erreur de lecture de la vidéo locale :", err)
        );
      }
    }
  }, [callType, callAccepted, remoteStream, localStream, remoteVideo, localVideo]);

  // Déterminer les informations du correspondant
  const activeUserProfile =
    incomingCall?.callerProfile || userData;

  return (
    <>
      {/* Flux Audio distant */}
      <audio ref={remoteAudio} autoPlay playsInline className="hidden" />

      {/* Visio Vidéo Plein Écran */}
      {callType === "video" && callAccepted && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
          {/* Vidéo du correspondant (Distant) */}
          <video
            ref={remoteVideo}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />

          {/* Ma propre vidéo (Retour local) */}
          <video
            ref={localVideo}
            autoPlay
            playsInline
            muted
            className="absolute bottom-5 right-5 h-36 w-36 rounded-lg border-2 border-white object-cover shadow-lg z-10"
          />

          {/* Bouton Raccrocher */}
          <button
            onClick={() => {
              endCall();
              setCallType("audio");
            }}
            className="absolute top-5 right-5 z-20 rounded-lg bg-red-600 px-5 py-2.5 font-medium text-white shadow-md hover:bg-red-700 transition"
          >
            Raccrocher
          </button>
        </div>
      )}

      {/* Appel en cours (Moi qui appelle) */}
      {isCalling && !callAccepted && (
        <CallModal title="Appel en cours..." userProfile={userData}>
          <button
            onClick={endCall}
            className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 transition"
          >
            Annuler
          </button>
        </CallModal>
      )}

      {/* Appel entrant (On m'appelle) */}
      {incomingCall && !callAccepted && (
        <CallModal
          title={`Appel ${
            incomingCall.callType === "video" ? "vidéo" : "audio"
          } entrant...`}
          userProfile={activeUserProfile}
        >
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (incomingCall.callType) {
                  setCallType(incomingCall.callType);
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
        <CallModal title="Appel audio en cours..." userProfile={activeUserProfile}>
          <button
            onClick={() => {
              endCall();
            }}
            className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 transition"
          >
            Raccrocher
          </button>
        </CallModal>
      )}
    </>
  );
}