'use client';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  User, Phone, Video, Mic, MicOff, Camera, CameraOff, Volume2, VolumeX, ChevronUp,
} from 'lucide-react';
import { providers } from '@/index';
import { useCallContext } from './CallProvider';

const formatTimer = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

/**
 * Lecteur vidéo uniquement.
 * Le SON distant est joué par le <audio> du CallProvider : les vidéos sont donc
 * toujours muettes ici pour éviter l'écho / le double son.
 */
const VideoEl = ({
  stream, className,
}: { stream: MediaStream | null; className?: string }) => {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  return <video ref={ref} autoPlay playsInline muted className={className} />;
};

export default function CallModal() {
  const call = useCallContext();
  const { callState } = call;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // La sonnerie d'appel entrant et la tonalité d'attente de l'appelant
  // sont gérées par useRingtone() / useRingback() dans CallProvider.

  if (!mounted || !callState) return null;

  // Un appel entrant s'affiche toujours en plein écran, même si un ancien état "réduit" traîne
  const showModal = !call.isMinimized || callState.status === 'incoming';
  const fullName = `${callState.partner.firstname} ${callState.partner.lastname || ''}`.trim();
  const statusLabel =
    callState.status === 'calling' ? 'Appel en cours…' :
      callState.status === 'incoming' ? `Appel ${callState.type === 'video' ? 'vidéo' : 'audio'} entrant` :
        callState.status === 'connecting' ? 'Connexion…' : formatTimer(call.duration);

  // Appel vidéo (hors appel entrant non décroché) : la vidéo occupe TOUT l'écran.
  //  - en attente / connexion : aperçu de ma caméra en plein écran
  //  - connecté : vidéo distante en plein écran + mon aperçu en petit
  const isVideo = callState.type === 'video';
  const videoStage = isVideo && callState.status !== 'incoming';
  const connected = callState.status === 'connected';
  const showRemote = videoStage && connected && !!call.remoteStream;
  const showLocalBackdrop = videoStage && !showRemote && !!call.localStream && !call.isVideoOff;

  const avatar = (size: string, icon: string) =>
    callState.partner.photo ? (
      <img src={`${providers.ImageUrl}/${callState.partner.photo}`} alt={callState.partner.firstname}
        className={`${size} rounded-full border-4 border-blue-600 object-cover shadow-2xl`} />
    ) : (
      <div className={`flex ${size} items-center justify-center rounded-full border-4 border-blue-600 bg-slate-900 shadow-2xl`}>
        <User className={`${icon} text-slate-500`} />
      </div>
    );

  return createPortal(
    <>
      {/* Bandeau appel réduit */}
      {call.isMinimized && callState.status !== 'incoming' && (
        <div className="fixed inset-x-0 top-0 z-[90] flex items-center justify-between bg-emerald-600 px-4 py-2 text-white shadow-lg">
          <button type="button" onClick={() => call.setMinimized(false)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left">
            {isVideo ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
            <span className="truncate text-sm font-semibold">{fullName}</span>
            <span className="text-xs text-emerald-100">{statusLabel}</span>
            <span className="ml-2 hidden text-xs sm:inline">Cliquer pour revenir</span>
          </button>
          <button type="button" onClick={call.hangUp} aria-label="Raccrocher"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 hover:bg-red-700">
            <Phone className="h-4 w-4 rotate-[135deg]" />
          </button>
        </div>
      )}

      {/* Modale plein écran */}
      {showModal && (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-between overflow-hidden ${videoStage ? 'bg-black' : 'bg-slate-950 p-6'}`}>

          {/* ---------- Fond vidéo plein écran (appels vidéo) ---------- */}
          {videoStage && (
            <div className="absolute inset-0">
              {showRemote ? (
                <VideoEl stream={call.remoteStream} className="h-full w-full object-cover" />
              ) : showLocalBackdrop ? (
                <>
                  <VideoEl stream={call.localStream} className="h-full w-full -scale-x-100 object-cover" />
                  <div className="absolute inset-0 bg-black/35" />
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900">
                  {avatar('h-32 w-32', 'h-14 w-14')}
                </div>
              )}
            </div>
          )}

          {/* ---------- En-tête ---------- */}
          <div className={`z-10 flex w-full max-w-2xl items-center justify-between ${videoStage ? 'bg-gradient-to-b from-black/70 to-transparent p-6 pb-10' : ''}`}>
            {callState.status !== 'incoming' ? (
              <button type="button" onClick={() => call.setMinimized(true)} aria-label="Réduire l'appel"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-800 bg-slate-900/80 text-white hover:bg-slate-800">
                <ChevronUp className="h-5 w-5" />
              </button>
            ) : <span className="w-11" />}

            <div className="flex flex-col items-center">
              <div className="mb-2 flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-1.5">
                {isVideo
                  ? <Video className="h-3.5 w-3.5 text-blue-500" />
                  : <Phone className="h-3.5 w-3.5 text-blue-500" />}
                <span className="text-xs font-bold uppercase tracking-wide text-blue-400">
                  Appel {isVideo ? 'vidéo' : 'audio'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium tabular-nums text-slate-300">
                <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {statusLabel}
              </div>
            </div>

            <span className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold text-slate-900">LRCSheet Pro</span>
          </div>

          {/* ---------- Zone centrale ---------- */}
          {videoStage ? (
            <div className="relative z-10 flex w-full flex-1 flex-col items-center">
              {/* Nom + état par-dessus la vidéo tant que l'autre n'a pas décroché */}
              {!showRemote && (
                <div className="mt-2 flex flex-col items-center px-6 text-center [text-shadow:0_1px_6px_rgba(0,0,0,0.7)]">
                  <h3 className="text-2xl font-bold text-white">{fullName}</h3>
                  <p className="mt-1 text-sm text-slate-200">
                    {callState.status === 'calling' ? 'Ça sonne…' : statusLabel}
                  </p>
                </div>
              )}

              {/* Mon aperçu en petit, une fois l'appel connecté */}
              {showRemote && call.localStream && !call.isVideoOff && (
                <div className="absolute bottom-4 right-4 h-44 w-32 overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-900 shadow-2xl">
                  <VideoEl stream={call.localStream} className="h-full w-full -scale-x-100 object-cover" />
                </div>
              )}
              {connected && !call.remoteStream && (
                <p className="mt-6 text-sm text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.7)]">Connexion de la vidéo distante…</p>
              )}
            </div>
          ) : (
            <div className="relative my-4 flex w-full max-w-2xl flex-1 items-center justify-center overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
              <div className="flex flex-col items-center">
                {avatar('h-32 w-32', 'h-14 w-14')}
                <h3 className="mt-5 text-center text-2xl font-bold text-white">{fullName}</h3>
                <p className="mt-1 text-sm text-slate-400">{statusLabel}</p>
              </div>
            </div>
          )}

          {/* ---------- Boutons ---------- */}
          <div className={`z-10 w-full max-w-sm ${videoStage ? 'bg-gradient-to-t from-black/70 to-transparent px-6 pb-8 pt-10' : 'mb-6'}`}>
            {callState.status === 'incoming' ? (
              <div className="flex items-center justify-around">
                <button type="button" onClick={call.hangUp} aria-label="Refuser l'appel"
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:scale-105 hover:bg-red-700">
                  <Phone className="h-7 w-7 rotate-[135deg]" />
                </button>
                <button type="button" onClick={call.acceptCall} aria-label="Accepter l'appel"
                  className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:scale-105 hover:bg-emerald-700">
                  {isVideo ? <Video className="h-7 w-7" /> : <Phone className="h-7 w-7" />}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="flex w-full items-center justify-around rounded-3xl border border-slate-800 bg-slate-900/90 p-4 backdrop-blur">
                  <button type="button" onClick={call.toggleMute}
                    title={call.isMuted ? 'Activer le micro' : 'Couper le micro'}
                    className={`flex h-14 w-14 items-center justify-center rounded-full ${call.isMuted ? 'bg-white text-slate-900' : 'border border-slate-700 bg-slate-800 text-white hover:bg-slate-700'}`}>
                    {call.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                  {isVideo && (
                    <button type="button" onClick={call.toggleVideo}
                      title={call.isVideoOff ? 'Activer la caméra' : 'Désactiver la caméra'}
                      className={`flex h-14 w-14 items-center justify-center rounded-full ${call.isVideoOff ? 'bg-white text-slate-900' : 'border border-slate-700 bg-slate-800 text-white hover:bg-slate-700'}`}>
                      {call.isVideoOff ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                    </button>
                  )}
                  <button type="button" onClick={call.toggleSpeaker}
                    title={call.isSpeakerOn ? 'Couper le son' : 'Activer le son'}
                    className={`flex h-14 w-14 items-center justify-center rounded-full ${call.isSpeakerOn ? 'border border-slate-700 bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-slate-900'}`}>
                    {call.isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                  </button>
                </div>
                <button type="button" onClick={call.hangUp} title="Raccrocher" aria-label="Raccrocher"
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-xl hover:scale-105 hover:bg-red-700">
                  <Phone className="h-7 w-7 rotate-[135deg]" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
