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

const StreamEl = ({
  stream, kind, muted, className,
}: { stream: MediaStream | null; kind: 'video' | 'audio'; muted?: boolean; className?: string }) => {
  const ref = useRef<any>(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  if (kind === 'audio') return <audio ref={ref} autoPlay muted={muted} />;
  return <video ref={ref} autoPlay playsInline muted={muted} className={className} />;
};

export default function CallModal() {
  const call = useCallContext();
  const { callState } = call;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Sonnerie sur appel entrant (optionnel : place /sounds/ringtone.mp3 dans /public)
  const ringRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (callState?.status === 'incoming') {
      try {
        ringRef.current = new Audio('/sounds/ringtone.mp3');
        ringRef.current.loop = true;
        ringRef.current.play().catch(() => undefined);
      } catch { /* ignore */ }
    }
    return () => { ringRef.current?.pause(); ringRef.current = null; };
  }, [callState?.status]);

  if (!mounted || !callState) return null;

  // Un appel entrant s'affiche toujours en plein écran, même si un ancien état "réduit" traîne
  const showModal = !call.isMinimized || callState.status === 'incoming';
  const fullName = `${callState.partner.firstname} ${callState.partner.lastname || ''}`.trim();
  const statusLabel =
    callState.status === 'calling' ? 'Appel en cours…' :
      callState.status === 'incoming' ? `Appel ${callState.type === 'video' ? 'vidéo' : 'audio'} entrant` :
        callState.status === 'connecting' ? 'Connexion…' : formatTimer(call.duration);

  return createPortal(
    <>
      {/* Son de l'interlocuteur : toujours monté, même réduit */}
      {callState.type === 'audio' && (
        <StreamEl stream={call.remoteStream} kind="audio" muted={!call.isSpeakerOn} />
      )}

      {/* Bandeau appel réduit */}
      {call.isMinimized && callState.status !== 'incoming' && (
        <div className="fixed inset-x-0 top-0 z-[90] flex items-center justify-between bg-emerald-600 px-4 py-2 text-white shadow-lg">
          <button type="button" onClick={() => call.setMinimized(false)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left">
            {callState.type === 'video' ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
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
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-slate-950 p-6">
          <div className="z-10 flex w-full max-w-2xl items-center justify-between">
            {callState.status !== 'incoming' ? (
              <button type="button" onClick={() => call.setMinimized(true)} aria-label="Réduire l'appel"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-800 bg-slate-900/80 text-white hover:bg-slate-800">
                <ChevronUp className="h-5 w-5" />
              </button>
            ) : <span className="w-11" />}

            <div className="flex flex-col items-center">
              <div className="mb-2 flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-1.5">
                {callState.type === 'video'
                  ? <Video className="h-3.5 w-3.5 text-blue-500" />
                  : <Phone className="h-3.5 w-3.5 text-blue-500" />}
                <span className="text-xs font-bold uppercase tracking-wide text-blue-400">
                  Appel {callState.type === 'video' ? 'vidéo' : 'audio'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium tabular-nums text-slate-300">
                <span className={`h-2 w-2 rounded-full ${callState.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {statusLabel}
              </div>
            </div>

            <span className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold text-slate-900">LRCSheet Pro</span>
          </div>

          <div className="relative my-4 flex w-full max-w-2xl flex-1 items-center justify-center overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
            {callState.type === 'video' && callState.status === 'connected' ? (
              <>
                {call.remoteStream ? (
                  <StreamEl stream={call.remoteStream} kind="video" muted={!call.isSpeakerOn} className="h-full w-full object-cover" />
                ) : (
                  <p className="text-sm text-white">Connexion de la vidéo distante…</p>
                )}
                {call.localStream && !call.isVideoOff && (
                  <div className="absolute bottom-4 right-4 h-44 w-32 overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-900 shadow-2xl">
                    <StreamEl stream={call.localStream} kind="video" muted className="h-full w-full -scale-x-100 object-cover" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center">
                {callState.partner.photo ? (
                  <img src={`${providers.ImageUrl}/${callState.partner.photo}`} alt={callState.partner.firstname}
                    className="h-32 w-32 rounded-full border-4 border-blue-600 object-cover shadow-2xl" />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-blue-600 bg-slate-900 shadow-2xl">
                    <User className="h-14 w-14 text-slate-500" />
                  </div>
                )}
                <h3 className="mt-5 text-center text-2xl font-bold text-white">{fullName}</h3>
                <p className="mt-1 text-sm text-slate-400">{statusLabel}</p>
              </div>
            )}
          </div>

          <div className="z-10 mb-6 w-full max-w-sm">
            {callState.status === 'incoming' ? (
              <div className="flex items-center justify-around">
                <button type="button" onClick={call.hangUp} aria-label="Refuser l'appel"
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:scale-105 hover:bg-red-700">
                  <Phone className="h-7 w-7 rotate-[135deg]" />
                </button>
                <button type="button" onClick={call.acceptCall} aria-label="Accepter l'appel"
                  className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:scale-105 hover:bg-emerald-700">
                  {callState.type === 'video' ? <Video className="h-7 w-7" /> : <Phone className="h-7 w-7" />}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="flex w-full items-center justify-around rounded-3xl border border-slate-800 bg-slate-900/90 p-4">
                  <button type="button" onClick={call.toggleMute}
                    title={call.isMuted ? 'Activer le micro' : 'Couper le micro'}
                    className={`flex h-14 w-14 items-center justify-center rounded-full ${call.isMuted ? 'bg-white text-slate-900' : 'border border-slate-700 bg-slate-800 text-white hover:bg-slate-700'}`}>
                    {call.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                  {callState.type === 'video' && (
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
