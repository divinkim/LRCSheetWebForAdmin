'use client';
import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { useSession } from 'next-auth/react';
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
  isSpeakerOn: boolean;
  duration: number;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (partner: CallPartner, type: 'audio' | 'video') => Promise<void>;
  acceptCall: () => Promise<void>;
  hangUp: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
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

/* ------------------------------------------------------------------ */
/* Provider (logique uniquement : l'UI est dans <CallModal />, monté   */
/* dans app/layout.tsx à l'intérieur de <CallProvider>)                */
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
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
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

  // Le son distant passe par un <audio> toujours monté (même appel réduit / audio seul / vidéo)
  useEffect(() => {
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  // Haut-parleur : coupe / réactive le son entrant
  useEffect(() => {
    if (remoteAudioRef.current) remoteAudioRef.current.muted = !isSpeakerOn;
  }, [isSpeakerOn, remoteStream]);

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
    setIsMuted(false); setIsVideoOff(false); setIsSpeakerOn(true); setMinimized(false);
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
  const toggleSpeaker = () => setIsSpeakerOn((s) => !s);

  const value: Ctx = {
    callState, isMinimized, setMinimized, isMuted, isVideoOff, isSpeakerOn, duration,
    localStream, remoteStream,
    startCall, acceptCall, hangUp, toggleMute, toggleVideo, toggleSpeaker, subscribeCallLogged,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
      {/* son distant (toujours monté, géré par isSpeakerOn) */}
      <audio ref={remoteAudioRef} autoPlay />
    </CallContext.Provider>
  );
}
