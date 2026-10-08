'use client';
import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { useSession } from 'next-auth/react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, ChevronDown, User } from 'lucide-react';
import { providers } from '@/index';
import { useToast } from '@/components/toast';
import { useChatSocket, CHAT_SERVER_URL } from './ChatSocketProvider';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export interface CallPartner { id: number; firstname: string; lastname?: string; photo?: string }
export interface CallState {
  type: 'audio' | 'video';
  isIncoming: boolean;
  status: 'calling' | 'incoming' | 'connecting' | 'connected';
  partner: CallPartner;
}
interface Ctx {
  callState: CallState | null;
  isMinimized: boolean;
  setMinimized: (v: boolean) => void;
  isMuted: boolean;
  isVideoOff: boolean;
  duration: number;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (partner: CallPartner, type: 'audio' | 'video') => Promise<void>;
  acceptCall: () => Promise<void>;
  hangUp: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  /** s'abonne à "un appel vient d'être journalisé" (retourne la fonction de désabonnement) */
  subscribeCallLogged: (fn: () => void) => () => void;
}
const CallContext = createContext<Ctx | null>(null);
export const useCallContext = () => {
  const c = useContext(CallContext);
  if (!c) throw new Error('useCallContext doit être utilisé dans <CallProvider>');
  return c;
};

const RING_TIMEOUT_MS = 45000;
const configuration: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Ajoute un serveur TURN en production
  ],
};

const formatTimer = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

/* ------------------------------------------------------------------ */
/* Petits composants                                                   */
/* ------------------------------------------------------------------ */
const StreamVideo = ({ stream, muted, mirror, className }: {
  stream: MediaStream | null; muted?: boolean; mirror?: boolean; className?: string;
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  return (
    <video ref={ref} autoPlay playsInline muted={muted} className={className}
      style={mirror ? { transform: 'scaleX(-1)' } : undefined} />
  );
};

/** Sonnerie simple (meilleur effort : le navigateur peut bloquer l'audio sans interaction préalable) */
const useRingtone = (active: boolean) => {
  useEffect(() => {
    if (!active) return;
    let ctx: AudioContext | null = null;
    let timer: any;
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      ctx = new AC();
      ctx.resume?.().catch(() => {});
      const beep = () => {
        if (!ctx) return;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = 440; g.gain.value = 0.08;
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + 0.4);
      };
      beep();
      timer = setInterval(beep, 1500);
    } catch { /* pas de sonnerie */ }
    return () => { clearInterval(timer); ctx?.close().catch(() => {}); };
  }, [active]);
};

const RoundBtn = ({ onClick, active, label, children }: {
  onClick: () => void; active?: boolean; label: string; children: React.ReactNode;
}) => (
  <button type="button" onClick={onClick} aria-label={label} title={label}
    className={`flex h-14 w-14 items-center justify-center rounded-full shadow-md transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
      active ? 'bg-white text-slate-900' : 'border border-slate-700 bg-slate-800 text-white hover:bg-slate-700'}`}>
    {children}
  </button>
);

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */
export default function CallProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useChatSocket();
  const { data: session } = useSession();
  const toast = useToast();

  const me: any = session?.user;
  const currentUserId = Number(me?.id);
  const myProfile = { firstname: me?.firstname || me?.name || '', lastname: me?.lastname || '', photo: me?.photo };

  const [callState, _setCallState] = useState<CallState | null>(null);
  const callRef = useRef<CallState | null>(null);
  const setCall = useCallback((fn: (p: CallState | null) => CallState | null) => {
    const next = fn(callRef.current);
    callRef.current = next;
    _setCallState(next);
  }, []);

  const [isMinimized, setMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localRef = useRef<MediaStream | null>(null);
  const remoteRef = useRef<MediaStream | null>(null);
  const offerRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const ringTimer = useRef<any>(null);
  const connectedAtRef = useRef<number | null>(null);
  const listeners = useRef<Set<() => void>>(new Set());
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const toastRef = useRef(toast); toastRef.current = toast;
  const userIdRef = useRef(currentUserId); userIdRef.current = currentUserId;

  const subscribeCallLogged = useCallback((fn: () => void) => {
    listeners.current.add(fn);
    return () => { listeners.current.delete(fn); };
  }, []);
  const notifyLogged = () => listeners.current.forEach((fn) => fn());

  // Le son distant passe par un <audio> toujours monté (même appel réduit / audio seul)
  useEffect(() => {
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  // Chrono
  useEffect(() => {
    if (callState?.status !== 'connected') { setDuration(0); return; }
    connectedAtRef.current = Date.now();
    const t = setInterval(() => setDuration(Math.round((Date.now() - (connectedAtRef.current || Date.now())) / 1000)), 1000);
    return () => clearInterval(t);
  }, [callState?.status]);

  useRingtone(callState?.status === 'incoming');

  // Journalise l'appel (seul l'appelant écrit pour éviter les doublons)
  const logCall = useCallback(async (info: {
    partnerId: number; duration: number; isIncoming: boolean; wasConnected: boolean;
  }) => {
    if (info.isIncoming) {
      setTimeout(notifyLogged, 1500); // le récepteur recharge après l'écriture de l'appelant
      return;
    }
    try {
      await providers.API.post(CHAT_SERVER_URL, 'chats', null, {
        title: '',
        senderId: userIdRef.current,
        receiverId: info.partnerId,
        content: '',
        file: '',
        role: 'client',
        callDuration: info.wasConnected ? info.duration : 0,
        callStatus: info.wasConnected,
      });
      notifyLogged();
    } catch (e) {
      console.warn("Journalisation de l'appel impossible", e);
    }
  }, []);

  const endLocal = useCallback((silent = false) => {
    const ended = callRef.current;
    callRef.current = null;
    if (ended && !silent) {
      const dur = connectedAtRef.current ? Math.round((Date.now() - connectedAtRef.current) / 1000) : 0;
      logCall({
        partnerId: ended.partner.id, duration: dur,
        isIncoming: ended.isIncoming, wasConnected: ended.status === 'connected',
      });
    }
    clearTimeout(ringTimer.current);
    localRef.current?.getTracks().forEach((t) => t.stop());
    remoteRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null; localRef.current = null; remoteRef.current = null;
    offerRef.current = null; pendingIce.current = []; connectedAtRef.current = null;
    setLocalStream(null); setRemoteStream(null);
    setIsMuted(false); setIsVideoOff(false); setMinimized(false);
    setCall(() => null);
  }, [setCall, logCall]);

  const getMedia = async (video: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: video ? { width: 640, height: 480 } : false,
      });
      localRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (e) {
      console.error('Accès média refusé/impossible', e);
      return null;
    }
  };

  const createPC = (partnerId: number) => {
    const pc = new RTCPeerConnection(configuration);
    pc.onicecandidate = (e) => {
      if (e.candidate) socket?.emit('iceCandidate', { to: partnerId, candidate: e.candidate.toJSON() });
    };
    pc.ontrack = (e) => {
      const stream = e.streams?.[0] || new MediaStream([e.track]);
      remoteRef.current = stream;
      setRemoteStream(stream);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        const c = callRef.current;
        if (c) socket?.emit('endCall', { to: c.partner.id, from: userIdRef.current });
        endLocal();
      } else if (pc.connectionState === 'closed') endLocal();
    };
    pcRef.current = pc;
    return pc;
  };

  const flushIce = async () => {
    for (const c of pendingIce.current) {
      try { await pcRef.current?.addIceCandidate(c); } catch (e) { console.warn('ICE', e); }
    }
    pendingIce.current = [];
  };

  // Évènements socket d'appel (via refs => pas de closures périmées)
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const onIncoming = (d: any) => {
      if (callRef.current) {
        socket.emit('rejectCall', { to: d.from, from: currentUserId, reason: 'busy' });
        return;
      }
      offerRef.current = d.offer;
      setMinimized(false);
      setCall(() => ({
        type: d.type || 'audio', isIncoming: true, status: 'incoming',
        partner: {
          id: Number(d.from),
          firstname: d.callerProfile?.firstname || 'Collaborateur',
          lastname: d.callerProfile?.lastname || '',
          photo: d.callerProfile?.photo,
        },
      }));
    };
    const onAnswered = async (d: any) => {
      if (!pcRef.current || !d.answer) return;
      clearTimeout(ringTimer.current);
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(d.answer));
      await flushIce();
      setCall((p) => (p ? { ...p, status: 'connected' } : p));
    };
    const onIce = async (d: any) => {
      if (!d.candidate) return;
      if (pcRef.current?.remoteDescription) {
        try { await pcRef.current.addIceCandidate(d.candidate); } catch (e) { console.warn(e); }
      } else pendingIce.current.push(d.candidate);
    };
    const onRejected = (d: any) => {
      toastRef.current.info('Appel', d?.reason === 'busy' ? 'Votre collaborateur est déjà en appel' : 'Appel refusé');
      endLocal();
    };
    const onEnded = () => endLocal();

    socket.on('incomingCall', onIncoming);
    socket.on('callAnswered', onAnswered);
    socket.on('iceCandidate', onIce);
    socket.on('callRejected', onRejected);
    socket.on('callEnded', onEnded);
    return () => {
      socket.off('incomingCall', onIncoming);
      socket.off('callAnswered', onAnswered);
      socket.off('iceCandidate', onIce);
      socket.off('callRejected', onRejected);
      socket.off('callEnded', onEnded);
    };
  }, [socket, currentUserId, endLocal, setCall]);

  // ---- Actions
  const startCall = async (partner: CallPartner, type: 'audio' | 'video') => {
    if (callRef.current) return toast.info('Appel', 'Un appel est déjà en cours');
    if (!socket?.connected) return toast.info('Appel', 'Connexion au serveur en cours...');
    if (typeof RTCPeerConnection === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return toast.info('Appel', 'Appels non supportés (HTTPS requis)');
    }
    setMinimized(false);
    setCall(() => ({ type, isIncoming: false, status: 'calling', partner }));

    const stream = await getMedia(type === 'video');
    if (!stream) { toast.info('Appel', 'Permission micro/caméra refusée'); endLocal(true); return; }
    const pc = createPC(partner.id);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('callUser', { to: partner.id, from: currentUserId, type, offer, callerProfile: myProfile });

    ringTimer.current = setTimeout(() => {
      if (callRef.current?.status === 'calling') {
        socket.emit('endCall', { to: partner.id, from: currentUserId });
        toast.info('Appel', 'Pas de réponse');
        endLocal();
      }
    }, RING_TIMEOUT_MS);
  };

  const hangUp = () => {
    const c = callRef.current;
    if (c) socket?.emit(c.status === 'incoming' ? 'rejectCall' : 'endCall', { to: c.partner.id, from: currentUserId });
    endLocal();
  };

  const acceptCall = async () => {
    const c = callRef.current;
    if (!c || !offerRef.current) return;
    setCall((p) => (p ? { ...p, status: 'connecting' } : p));

    const stream = await getMedia(c.type === 'video');
    if (!stream) { toast.info('Appel', 'Permission micro/caméra refusée'); hangUp(); return; }
    const pc = createPC(c.partner.id);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(offerRef.current));
    await flushIce();
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket?.emit('answerCall', { to: c.partner.id, answer });
    setCall((p) => (p ? { ...p, status: 'connected' } : p));
  };

  const toggleMute = () => {
    localRef.current?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsMuted((m) => !m);
  };
  const toggleVideo = () => {
    localRef.current?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsVideoOff((v) => !v);
  };

  const value: Ctx = {
    callState, isMinimized, setMinimized, isMuted, isVideoOff, duration,
    localStream, remoteStream,
    startCall, acceptCall, hangUp, toggleMute, toggleVideo, subscribeCallLogged,
  };

  /* ---------------- UI globale ---------------- */
  const status = callState?.status;
  const canMinimize = status !== 'incoming';
  const showFull = !!callState && (!isMinimized || status === 'incoming');

  useEffect(() => {
    if (!showFull || !canMinimize) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMinimized(true); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showFull, canMinimize]);

  const partner = callState?.partner;
  const type = callState?.type;
  const fullName = partner ? `${partner.firstname} ${partner.lastname || ''}`.trim() : '';
  const isVideoConnected = type === 'video' && status === 'connected';
  const statusLabel =
    status === 'calling' ? 'Appel en cours...' :
    status === 'incoming' ? `Appel ${type === 'video' ? 'vidéo' : 'audio'} entrant` :
    status === 'connecting' ? 'Connexion...' : formatTimer(duration);

  return (
    <CallContext.Provider value={value}>
      {children}

      {/* son distant (toujours monté) */}
      <audio ref={remoteAudioRef} autoPlay />

      {callState && partner && (
        <>
          {/* ---------- Bandeau réduit ---------- */}
          {isMinimized && canMinimize && (
            <div className="fixed inset-x-0 top-0 z-[9999] flex items-center justify-between bg-emerald-600 px-4 py-2 text-white shadow-lg">
              <button type="button" onClick={() => setMinimized(false)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                {type === 'video' ? <Video className="h-4 w-4 shrink-0" /> : <Phone className="h-4 w-4 shrink-0" />}
                <span className="truncate text-sm font-semibold">{fullName}</span>
                <span className="text-xs text-emerald-100">{statusLabel}</span>
                <span className="ml-3 hidden text-xs sm:inline">Cliquer pour revenir</span>
              </button>
              <button type="button" onClick={hangUp} aria-label="Raccrocher"
                className="ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 hover:bg-red-700">
                <PhoneOff className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ---------- Plein écran ---------- */}
          {showFull && (
            <div role="dialog" aria-modal="true" aria-label="Appel"
              className="fixed inset-0 z-[10000] flex flex-col items-center justify-between bg-slate-950 p-6 text-white">
              {isVideoConnected && (
                <div className="absolute inset-0 bg-black">
                  {remoteStream ? (
                    <StreamVideo stream={remoteStream} muted className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm">Connexion de la vidéo distante...</div>
                  )}
                  {localStream && !isVideoOff && (
                    <div className="absolute right-4 top-20 h-40 w-28 overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-900 shadow-2xl">
                      <StreamVideo stream={localStream} muted mirror className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              )}

              {/* En-tête */}
              <div className="z-10 flex w-full items-center justify-between">
                {canMinimize ? (
                  <button type="button" onClick={() => setMinimized(true)} aria-label="Réduire"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-800 bg-slate-900/80 hover:bg-slate-800">
                    <ChevronDown className="h-4 w-4" />
                  </button>
                ) : <div className="w-11" />}

                <div className="flex flex-col items-center">
                  <span className="mb-2 flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-400">
                    {type === 'video' ? <Video className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
                    Appel {type === 'video' ? 'vidéo' : 'audio'}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                    <span className={`h-2 w-2 rounded-full ${status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {statusLabel}
                  </span>
                </div>

                <span className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold text-slate-900">LRCSheet Pro</span>
              </div>

              {/* Avatar + nom */}
              {!isVideoConnected && (
                <div className="z-10 flex flex-col items-center">
                  {partner.photo ? (
                    <img src={`${providers.ImageUrl}/${partner.photo}`} alt={fullName}
                      className="h-32 w-32 rounded-full border-4 border-blue-600 object-cover shadow-2xl" />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-blue-600 bg-slate-900 shadow-2xl">
                      <User className="h-14 w-14 text-slate-500" />
                    </div>
                  )}
                  <p className="mt-5 text-center text-2xl font-bold">{fullName}</p>
                  <p className="mt-1 text-sm text-slate-400">{statusLabel}</p>
                </div>
              )}

              {/* Contrôles */}
              <div className="z-10 mb-6 flex items-center justify-center gap-5">
                {status === 'incoming' ? (
                  <>
                    <button type="button" onClick={hangUp} aria-label="Refuser"
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg hover:bg-red-700 active:scale-95">
                      <PhoneOff className="h-6 w-6" />
                    </button>
                    <button type="button" onClick={acceptCall} aria-label="Accepter"
                      className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-emerald-600 shadow-lg hover:bg-emerald-700 active:scale-95">
                      {type === 'video' ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
                    </button>
                  </>
                ) : (
                  <>
                    <RoundBtn onClick={toggleMute} active={isMuted} label={isMuted ? 'Réactiver le micro' : 'Couper le micro'}>
                      {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </RoundBtn>
                    {type === 'video' && (
                      <RoundBtn onClick={toggleVideo} active={isVideoOff} label={isVideoOff ? 'Activer la caméra' : 'Couper la caméra'}>
                        {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                      </RoundBtn>
                    )}
                    <button type="button" onClick={hangUp} aria-label="Raccrocher"
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg hover:bg-red-700 active:scale-95">
                      <PhoneOff className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </CallContext.Provider>
  );
}