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
const RINGTONE_URL = '/sounds/ringtone.wav'; // sonnerie du DESTINATAIRE (fichier dans /public/sounds)
const RINGBACK_URL = '/sounds/ringback.mp3'; // tonalité d'attente de l'APPELANT (optionnel, voir useRingback)
const configuration: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Ajoute un serveur TURN en production
  ],
};

/**
 * Sonnerie d'appel entrant : fichier audio en boucle, avec repli sur des bips
 * si le navigateur bloque la lecture (pas d'interaction préalable avec la page).
 * Exportée : réutilisée par GroupCallProvider pour les invitations de groupe.
 */
export const useRingtone = (active: boolean) => {
  useEffect(() => {
    if (!active) return;
    let audio: HTMLAudioElement | null = null;
    let ctx: AudioContext | null = null;
    let timer: any;

    const startBeeps = () => {
      try {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        ctx = new AC();
        ctx.resume?.().catch(() => { });
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
    };

    try {
      audio = new Audio(RINGTONE_URL);
      audio.loop = true;
      audio.volume = 1;
      audio.play().catch(startBeeps);
      audio.onerror = () => { if (!ctx) startBeeps(); };
    } catch {
      startBeeps();
    }

    // vibration sur mobile
    try { navigator.vibrate?.([500, 300, 500, 300, 500]); } catch { /* ignoré */ }

    return () => {
      clearInterval(timer);
      ctx?.close().catch(() => { });
      if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
      try { navigator.vibrate?.(0); } catch { /* ignoré */ }
    };
  }, [active]);
};

/**
 * Tonalité d'attente de l'APPELANT ("tuuut... tuuut...") tant que le destinataire
 * n'a pas décroché. S'arrête automatiquement quand `active` repasse à false
 * (décroché, refusé, raccroché, expiré).
 *
 * Si /public/sounds/ringback.mp3 existe, il est joué en boucle (ex. un son type
 * WhatsApp). Sinon, repli sur une tonalité synthétique 425 Hz : 1 s de son / 3 s de silence.
 * Aucune vibration (c'est l'appelant).
 */
const useRingback = (active: boolean) => {
  useEffect(() => {
    if (!active) return;
    let audio: HTMLAudioElement | null = null;
    let ctx: AudioContext | null = null;
    let timer: any;
    let synthStarted = false;

    const startSynth = () => {
      if (synthStarted) return;
      synthStarted = true;
      try {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        ctx = new AC();
        ctx.resume?.().catch(() => { });
        const tone = () => {
          if (!ctx) return;
          const t = ctx.currentTime;
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = 425;
          // enveloppe douce pour éviter les "clics"
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.12, t + 0.05);
          g.gain.setValueAtTime(0.12, t + 0.95);
          g.gain.linearRampToValueAtTime(0, t + 1.0);
          o.connect(g); g.connect(ctx.destination);
          o.start(t); o.stop(t + 1.05);
        };
        tone();
        timer = setInterval(tone, 4000);
      } catch { /* pas de tonalité */ }
    };

    try {
      audio = new Audio(RINGBACK_URL);
      audio.loop = true;
      audio.volume = 0.8;
      audio.onerror = startSynth; // fichier absent => tonalité synthétique
      audio.play().catch(startSynth);
    } catch {
      startSynth();
    }

    return () => {
      clearInterval(timer);
      ctx?.close().catch(() => { });
      if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
    };
  }, [active]);
};

/* ------------------------------------------------------------------ */
/* Provider (logique uniquement : l'UI est dans <CallModal />, monté   */
/* dans app/layout.tsx à l'intérieur de <CallProvider>)                */
/* ------------------------------------------------------------------ */
export default function CallProvider({ children }: { children: React.ReactNode }) {
  const { socket, onlineUserIds } = useChatSocket();
  const { data: session } = useSession();
  const toast = useToast();

  const me: any = session?.user;
  const currentUserId = Number(me?.id);
  const myProfile = { firstname: me?.firstname || me?.name || '', lastname: me?.lastname || '', photo: me?.photo };
  const myProfileRef = useRef(myProfile); myProfileRef.current = myProfile;

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

  // push d'appel envoyé à un destinataire hors ligne (pour pouvoir l'annuler)
  const pushedRef = useRef<{ partner: CallPartner; type: 'audio' | 'video' } | null>(null);
  // "Répondre" cliqué sur la notification alors que l'app était fermée
  const autoAcceptRef = useRef<number | null>(null);
  const acceptRef = useRef<() => Promise<void>>(async () => { });
  const hangRef = useRef<() => void>(() => { });

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

  // Destinataire : sonnerie d'appel entrant
  useRingtone(callState?.status === 'incoming');
  // Appelant : tonalité d'attente tant que l'autre n'a pas décroché
  useRingback(callState?.status === 'calling');

  /* ---------------- Service worker : sonnerie en arrière-plan ---------------- */
  // La page prend le relais (modal + sonnerie) : on stoppe la boucle de notifications du SW
  useEffect(() => {
    if (callState?.status !== 'incoming' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.active?.postMessage({ type: 'STOP_RINGING' }))
      .catch(() => { });
  }, [callState?.status]);

  // Boutons Répondre / Refuser de la notification quand une fenêtre est déjà ouverte
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type !== 'CALL_ACTION') return;
      const c = callRef.current;
      if (!c || c.status !== 'incoming') {
        // l'appel n'est pas encore arrivé par le socket : on répondra dès qu'il arrive
        if (e.data.action === 'accept') autoAcceptRef.current = Number(e.data.senderId);
        return;
      }
      if (e.data.action === 'decline') hangRef.current();
      else acceptRef.current();
    };
    navigator.serviceWorker.addEventListener('message', onMsg);
    return () => navigator.serviceWorker.removeEventListener('message', onMsg);
  }, []);

  // Page ouverte depuis la notification (?acceptCallFrom=ID)
  useEffect(() => {
    const url = new URL(window.location.href);
    const from = Number(url.searchParams.get('acceptCallFrom'));
    if (from) {
      autoAcceptRef.current = from;
      url.searchParams.delete('acceptCallFrom');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
      // sans réponse du serveur au bout de la durée de sonnerie, on abandonne
      setTimeout(() => { if (autoAcceptRef.current === from) autoAcceptRef.current = null; }, RING_TIMEOUT_MS);
    }
  }, []);

  /* ---------------- Push d'appel (destinataire hors ligne) ---------------- */
  const sendCallPush = useCallback(async (
    kind: 'call' | 'call_cancel', partner: CallPartner, callType: 'audio' | 'video',
  ) => {
    try {
      const name = `${myProfileRef.current.firstname} ${myProfileRef.current.lastname}`.trim();
      await providers.API.post(CHAT_SERVER_URL, 'notification-push', null, {
        title: kind === 'call' ? `Appel ${callType === 'video' ? 'vidéo' : 'audio'} entrant` : 'Appel manqué',
        content: name,
        senderId: String(userIdRef.current),
        receiverId: String(partner.id),
        messagingType: kind,
        callType,
        path: '/',
      });
    } catch (e) {
      console.warn("Push d'appel impossible", e);
    }
  }, []);

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
    // appel jamais décroché : on coupe la sonnerie sur l'appareil hors ligne
    const pushed = pushedRef.current;
    pushedRef.current = null;
    if (pushed && ended && ended.status !== 'connected') {
      sendCallPush('call_cancel', pushed.partner, pushed.type);
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
  }, [setCall, logCall, sendCallPush]);

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
      // l'utilisateur a déjà cliqué sur "Répondre" dans la notification
      if (autoAcceptRef.current === Number(d.from)) {
        autoAcceptRef.current = null;
        setTimeout(() => acceptRef.current(), 400);
      }
    };
    const onAnswered = async (d: any) => {
      if (!pcRef.current || !d.answer) return;
      clearTimeout(ringTimer.current);
      pushedRef.current = null; // décroché : plus rien à annuler
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(d.answer));
      await flushIce();
      // 'connected' => la tonalité d'attente s'arrête (useRingback)
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

    // Destinataire hors ligne (app fermée) : push FCM => sonnerie par défaut du système.
    // Le serveur garde l'appel en attente et le rejoue à sa connexion (cf. socket.gateway.ts).
    if (!(Array.isArray(onlineUserIds) && onlineUserIds.includes(partner.id))) {
      pushedRef.current = { partner, type };
      sendCallPush('call', partner, type);
    }

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

  acceptRef.current = acceptCall;
  hangRef.current = hangUp;

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
