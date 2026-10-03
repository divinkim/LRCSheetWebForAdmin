'use client';
import { useToast } from '@/components/toast';
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  FileText,
  ExternalLink,
  Volume2,
  Play,
  Pause,
  Trash2,
  Search,
  Loader2,
} from 'lucide-react';
import { useCollaboratorsChat } from './hook';
import { providers } from '@/index';
import { SidebarHook } from '@/components/Layouts/sidebar/hook';
import { UploadFileResponseDto } from '@/types/global';

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

// Passez à true quand le service d'appel est prêt.
const CALLS_ENABLED = true;

// Durée maximale d'une note vocale (en secondes).
const VOICE_MAX_SECONDS = 300;
const VOICE_MIN_SECONDS = 1;
const WAVE_BARS = 36;

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

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

interface ChatMessage {
  id: number | string;
  senderId: number;
  content: string;
  file?: string | null;
  createdAt?: string;
  /** Durée de la note vocale en secondes (à enregistrer en base) */
  audioDuration?: number | null;
  /** 'text' | 'voice' | ... */
  messageType?: string | null;
}

/** Données supplémentaires transmises à sendMessage() pour une note vocale */
export interface VoiceMessagePayload {
  file: string;
  audioDuration: number;
  messageType: 'voice';
}

interface VoiceResult {
  file: File;
  duration: number;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const formatTimer = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const isVoiceMessage = (m: ChatMessage) =>
  m.messageType === 'voice' ||
  (!!m.file && m.audioDuration != null) ||
  (!!m.file && /\.(webm|ogg|oga|m4a|mp3|wav|aac)$/i.test(m.file));

// Génère une forme d'onde stable à partir d'un identifiant (pour les messages reçus)
function seededBars(seed: string, count = WAVE_BARS) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    bars.push(0.25 + (Math.abs(h) % 1000) / 1000 * 0.75);
  }
  return bars;
}

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4', // Safari
    'audio/ogg;codecs=opus',
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

function extensionFor(mime: string) {
  if (mime.includes('mp4')) return 'm4a';
  if (mime.includes('ogg')) return 'ogg';
  return 'webm';
}

/* ------------------------------------------------------------------ */
/* Hook d'enregistrement vocal                                         */
/* ------------------------------------------------------------------ */

function useVoiceRecorder(opts: {
  maxSeconds: number;
  onMaxReached: () => void;
  onError: (message: string) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0); // secondes écoulées
  const [levels, setLevels] = useState<number[]>(() => Array(WAVE_BARS).fill(0.08));

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);
  const lastTickRef = useRef(0);
  const cancelledRef = useRef(false);
  const mimeRef = useRef('');
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    rafRef.current = null;
    intervalRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
    setDuration(0);
    setLevels(Array(WAVE_BARS).fill(0.08));
  }, []);

  const start = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      optsRef.current.onError("L'enregistrement audio n'est pas disponible sur ce navigateur.");
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      optsRef.current.onError("L'enregistrement audio n'est pas pris en charge sur ce navigateur.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      cancelledRef.current = false;
      chunksRef.current = [];

      const mime = pickMimeType();
      mimeRef.current = mime;
      const recorder = new MediaRecorder(
        stream,
        mime ? { mimeType: mime, audioBitsPerSecond: 64000 } : undefined
      );
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorderRef.current = recorder;

      // Analyse du volume pour l'onde en direct
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        audioCtxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const buf = new Uint8Array(analyser.fftSize);
        const tick = (t: number) => {
          rafRef.current = requestAnimationFrame(tick);
          if (t - lastTickRef.current < 70) return;
          lastTickRef.current = t;
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const level = Math.min(1, Math.max(0.08, Math.sqrt(sum / buf.length) * 4));
          setLevels((prev) => [...prev.slice(1), level]);
        };
        rafRef.current = requestAnimationFrame(tick);
      }

      recorder.start(250);
      startRef.current = Date.now();
      setIsRecording(true);
      setDuration(0);

      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startRef.current) / 1000;
        setDuration(elapsed);
        if (elapsed >= optsRef.current.maxSeconds) optsRef.current.onMaxReached();
      }, 200);
    } catch (err: any) {
      cleanup();
      optsRef.current.onError(
        err?.name === 'NotAllowedError'
          ? "Accès au micro refusé. Autorisez-le dans les réglages du navigateur."
          : "Impossible de démarrer l'enregistrement."
      );
    }
  }, [cleanup]);

  const stop = useCallback(
    () =>
      new Promise<VoiceResult | null>((resolve) => {
        const rec = recorderRef.current;
        if (!rec || rec.state === 'inactive') {
          resolve(null);
          return;
        }
        const elapsedSec = Math.round((Date.now() - startRef.current) / 1000);
        rec.onstop = () => {
          const rawType = rec.mimeType || mimeRef.current || 'audio/webm';
          const baseType = rawType.split(';')[0];
          const blob = new Blob(chunksRef.current, { type: baseType });
          const wasCancelled = cancelledRef.current;
          cleanup();
          if (wasCancelled || blob.size === 0) return resolve(null);
          const file = new File([blob], `voice-${Date.now()}.${extensionFor(baseType)}`, {
            type: baseType,
          });
          resolve({ file, duration: elapsedSec });
        };
        rec.stop();
      }),
    [cleanup]
  );

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.onstop = () => cleanup();
      rec.stop();
    } else {
      cleanup();
    }
  }, [cleanup]);

  useEffect(() => () => cancel(), [cancel]);

  return { isRecording, duration, levels, start, stop, cancel };
}

/* ------------------------------------------------------------------ */
/* Lecteur de note vocale                                              */
/* ------------------------------------------------------------------ */

let currentlyPlaying: HTMLAudioElement | null = null;
const SPEEDS = [1, 1.5, 2];

function VoiceNotePlayer({
  src,
  duration,
  seed,
  isMe,
}: {
  src: string;
  duration?: number | null;
  seed: string;
  isMe: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [realDuration, setRealDuration] = useState<number | null>(null);
  const [speedIndex, setSpeedIndex] = useState(0);
  const bars = React.useMemo(() => seededBars(seed), [seed]);

  // Les fichiers .webm enregistrés par le navigateur n'ont souvent pas de durée
  // dans leurs métadonnées : on privilégie donc la durée stockée en base.
  const total = duration && duration > 0 ? duration : realDuration ?? 0;
  const progress = total > 0 ? Math.min(1, current / total) : 0;

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      if (currentlyPlaying && currentlyPlaying !== el) currentlyPlaying.pause();
      currentlyPlaying = el;
      el.playbackRate = SPEEDS[speedIndex];
      el.play().catch(() => setPlaying(false));
    } else {
      el.pause();
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || total <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * total;
    setCurrent(ratio * total);
  };

  const cycleSpeed = () => {
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
  };

  const playedBar = isMe ? 'bg-amber-400 dark:bg-stone-900' : 'bg-amber-600 dark:bg-amber-400';
  const idleBar = isMe
    ? 'bg-stone-600 dark:bg-stone-900/30'
    : 'bg-stone-300 dark:bg-stone-600';

  return (
    <div className="flex w-60 items-center gap-3 sm:w-72">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d)) setRealDuration(d);
        }}
      />

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Mettre en pause' : 'Écouter la note vocale'}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
          isMe
            ? 'bg-amber-400 text-stone-900 dark:bg-stone-900 dark:text-amber-300'
            : 'bg-stone-900 text-amber-300 dark:bg-amber-400 dark:text-stone-900'
        }`}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
      </button>

      <div className="min-w-0 flex-1">
        <div
          onClick={seek}
          role="slider"
          aria-label="Position de lecture"
          aria-valuemin={0}
          aria-valuemax={Math.round(total)}
          aria-valuenow={Math.round(current)}
          className="flex h-8 cursor-pointer items-center gap-[2px]"
        >
          {bars.map((h, i) => (
            <span
              key={i}
              style={{ height: `${Math.round(h * 100)}%` }}
              className={`w-[3px] flex-1 rounded-full ${
                i / bars.length < progress ? playedBar : idleBar
              }`}
            />
          ))}
        </div>
        <div className="mt-0.5 flex items-center justify-between text-[11px] tabular-nums opacity-70">
          <span>{formatTimer(playing || current > 0 ? current : total)}</span>
          <button
            type="button"
            onClick={cycleSpeed}
            className="rounded-full px-1.5 font-medium hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Changer la vitesse de lecture"
          >
            {SPEEDS[speedIndex]}×
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

const CollaboratorsSkeleton = () => (
  <div className="flex h-[640px] w-full overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
    <div className="flex w-full flex-col md:w-80 lg:w-96">
      <div className="h-20 animate-pulse border-b border-stone-200 dark:border-stone-800" />
      <div className="flex-1 space-y-1 px-4 py-3">
        {[1, 2, 3, 4, 5, 6, 7].map((key) => (
          <div key={key} className="flex animate-pulse items-center py-3">
            <div className="mr-3 h-12 w-12 shrink-0 rounded-full bg-stone-200 dark:bg-stone-800" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-32 rounded bg-stone-200 dark:bg-stone-800" />
              <div className="h-3 w-44 rounded bg-stone-100 dark:bg-stone-800/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

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
    setFileName,
  } = useCollaboratorsChat();
  const { storedNotificationsArray, setStoredNotificationsArray } = SidebarHook();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef<boolean>(true);
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);

  // Appels & WebRTC
  const [callState, setCallState] = useState<CallState | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const chatMessages = messages as unknown as ChatMessage[];

  /* ---------------- Notes vocales ---------------- */

  const voice = useVoiceRecorder({
    maxSeconds: VOICE_MAX_SECONDS,
    onMaxReached: () => handleVoiceSend(),
    onError: (message) => toast.info('Micro', message),
  });

  const handleVoiceSend = async () => {
    if (isUploadingVoice) return;
    const result = await voice.stop();
    if (!result) return;

    if (result.duration < VOICE_MIN_SECONDS) {
      toast.info('Note vocale', 'Maintenez un peu plus longtemps pour enregistrer un message.');
      return;
    }

    setIsUploadingVoice(true);
    try {
      const res = await providers.API.post<UploadFileResponseDto>(
        providers.APIUrl,
        'media/upload-single',
        null,
        { file: result.file }
      );

      setFileName(res.filename);

      // La durée (en secondes) est transmise avec le message pour être
      // enregistrée en base (colonne audioDuration).
      const payload: VoiceMessagePayload = {
        file: res.filename,
        audioDuration: result.duration,
        messageType: 'voice',
      };
      (sendMessage as (extra?: VoiceMessagePayload) => void)(payload);

      isAtBottomRef.current = true;
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err) {
      console.error("Erreur lors de l'envoi de la note vocale :", err);
      toast.info('Note vocale', "L'envoi a échoué. Réessayez.");
    } finally {
      setIsUploadingVoice(false);
    }
  };

  // Échap annule l'enregistrement
  useEffect(() => {
    if (!voice.isRecording) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') voice.cancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [voice.isRecording]);

  // Changer de conversation annule l'enregistrement en cours
  useEffect(() => {
    voice.cancel();
  }, [selectedCollaborator?.id]);

  /* ---------------- Scroll ---------------- */

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

  /* ---------------- Chronomètre d'appel ---------------- */

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

  /* ---------------- WebRTC / Socket ---------------- */

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
        socket?.emit('iceCandidate', { to: targetUserId, candidate: event.candidate });
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

    if (!CALLS_ENABLED) {
      toast.info('Infos', 'Ce service est momentanément indisponible');
      return;
    }

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

      socket?.emit('answerCall', { to: callState.partner.id, answer });
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

  /* ---------------- Messages ---------------- */

  const isUserOnline = (id: number) => Array.isArray(onlineUserIds) && onlineUserIds.includes(id);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;
    sendMessage();
    isAtBottomRef.current = true;
    setTimeout(() => scrollToBottom(true), 50);
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
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const formatMessageHour = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const groupMessagesByDate = (msgList: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;

    msgList.forEach((msg) => {
      const msgDate = msg.createdAt ? new Date(msg.createdAt) : new Date();
      const day = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate()).getTime();

      let label = '';
      if (day === today) label = "Aujourd'hui";
      else if (day === yesterday) label = 'Hier';
      else
        label = msgDate.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

      if (!groups[label]) groups[label] = [];
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
    return storedNotificationsArray.filter(
      (item) => Number(item.senderId) === userId && item.messagingType === 'chat'
    ).length;
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

  const groupedMessages = groupMessagesByDate(chatMessages);
  const filteredCollaborators = collaborators.filter((c) =>
    `${c.firstname} ${c.lastname || ''}`.toLowerCase().includes(search.trim().toLowerCase())
  );
  const hasDraft = !!inputText.trim() || !!selectedFile;

  return (
    <div className="relative flex h-[640px] w-full overflow-hidden rounded-2xl border border-stone-200 bg-white font-sans text-stone-900 shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100">
      <audio
        ref={(el) => {
          if (el && remoteStreamRef.current && callState?.type === 'audio') el.srcObject = remoteStreamRef.current;
        }}
        autoPlay
      />

      {/* ============ LISTE DES COLLABORATEURS ============ */}
      <aside
        className={`${selectedCollaborator ? 'hidden md:flex' : 'flex'} h-full w-full shrink-0 flex-col border-r border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 md:w-80 lg:w-96`}
      >
        <div className="px-5 pb-3 pt-5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight">Discussions</h1>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">
              LRCSheet Pro
            </span>
          </div>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un collaborateur"
              className="w-full rounded-full border border-stone-200 bg-stone-50 py-2 pl-10 pr-4 text-sm outline-none transition-shadow placeholder:text-stone-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800 dark:bg-stone-950 dark:placeholder:text-stone-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {filteredCollaborators.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-stone-500 dark:text-stone-400">
              Aucun collaborateur trouvé.
            </p>
          )}
          {filteredCollaborators.map((item) => {
            const online = isUserOnline(item.id);
            const statusData = renderLastMessageOrStatus(item.id);
            const isSelected = selectedCollaborator?.id === item.id;
            const unread = getNotificationCount(item.id);
            return (
              <button
                key={item.id}
                onClick={() => {
                  selectCollaborator(item);
                  removeNoticationCount(item.id);
                }}
                className={`flex w-full items-center rounded-xl px-3 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isSelected
                    ? 'bg-stone-100 dark:bg-stone-800'
                    : 'hover:bg-stone-50 dark:hover:bg-stone-800/60'
                }`}
              >
                <div className="relative shrink-0">
                  {item.photo ? (
                    <img
                      src={`${providers.ImageUrl}/${item.photo}`}
                      alt={item.firstname}
                      className="h-12 w-12 rounded-full bg-stone-100 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
                      <User className="h-5 w-5 text-stone-500" />
                    </div>
                  )}
                  <span
                    className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-stone-900 ${
                      online ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'
                    }`}
                  />
                </div>

                <div className="ml-3 min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold">
                      {item.firstname} {item.lastname || ''}
                    </span>
                    <span
                      className={`shrink-0 text-xs ${
                        unread > 0
                          ? 'font-semibold text-amber-600 dark:text-amber-400'
                          : 'text-stone-400'
                      }`}
                    >
                      {statusData.time}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-xs ${
                        unread > 0
                          ? 'font-medium text-stone-800 dark:text-stone-200'
                          : 'text-stone-500 dark:text-stone-400'
                      }`}
                    >
                      {statusData.text}
                    </p>
                    {unread > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-semibold text-stone-900">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ============ ZONE DE CONVERSATION ============ */}
      {selectedCollaborator ? (
        <section className="flex h-full min-w-0 flex-1 flex-col bg-stone-50 dark:bg-stone-950">
          {/* En-tête */}
          <header className="flex shrink-0 items-center justify-between border-b border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex min-w-0 items-center">
              <button
                onClick={() => selectCollaborator(null as any)}
                className="mr-2 rounded-full p-2 text-stone-600 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-stone-300 dark:hover:bg-stone-800 md:hidden"
                title="Retour"
                aria-label="Retour à la liste"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              {selectedCollaborator.photo ? (
                <img
                  src={`${providers.ImageUrl}/${selectedCollaborator.photo}`}
                  alt={selectedCollaborator.firstname}
                  className="mr-3 h-10 w-10 shrink-0 rounded-full bg-stone-100 object-cover"
                />
              ) : (
                <div className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
                  <User className="h-5 w-5 text-stone-500" />
                </div>
              )}

              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold">
                  {selectedCollaborator.firstname} {selectedCollaborator.lastname || ''}
                </h2>
                <p className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isUserOnline(selectedCollaborator.id) ? 'bg-emerald-500' : 'bg-stone-300'
                    }`}
                  />
                  {isUserOnline(selectedCollaborator.id) ? 'En ligne' : 'Hors ligne'}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => triggerStartCall('audio')}
                className="rounded-full p-2.5 text-stone-600 transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-stone-300 dark:hover:bg-stone-800"
                title="Appel audio"
                aria-label="Appel audio"
              >
                <Phone className="h-[18px] w-[18px]" />
              </button>
              <button
                onClick={() => triggerStartCall('video')}
                className="rounded-full p-2.5 text-stone-600 transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-stone-300 dark:hover:bg-stone-800"
                title="Appel vidéo"
                aria-label="Appel vidéo"
              >
                <Video className="h-[18px] w-[18px]" />
              </button>
            </div>
          </header>

          {/* Messages */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
          >
            {Object.keys(groupedMessages).map((dateLabel) => (
              <div key={dateLabel} className="space-y-2">
                <div className="my-3 flex justify-center">
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-stone-500 shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:text-stone-400 dark:ring-stone-800">
                    {dateLabel}
                  </span>
                </div>

                {groupedMessages[dateLabel].map((item) => {
                  const isMe = item.senderId === currentUserId;
                  const voiceMsg = isVoiceMessage(item) && !!item.file;
                  const isHtmlMessage = !voiceMsg && containsHtml(item.content);
                  const formattedHour = formatMessageHour(item.createdAt);

                  return (
                    <div key={item.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm md:max-w-[70%] ${
                          isMe
                            ? 'rounded-br-md bg-stone-900 text-stone-50 dark:bg-amber-400 dark:text-stone-900'
                            : 'rounded-bl-md bg-white text-stone-800 shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:text-stone-100 dark:ring-stone-800'
                        }`}
                      >
                        {/* Note vocale */}
                        {voiceMsg && item.file && (
                          <VoiceNotePlayer
                            src={`${providers.ImageUrl}/${item.file}`}
                            duration={item.audioDuration}
                            seed={String(item.id)}
                            isMe={isMe}
                          />
                        )}

                        {/* Pièce jointe classique */}
                        {!voiceMsg && item.file && (
                          <a
                            href={`${providers.ImageUrl}/${item.file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mb-2 flex items-center gap-2.5 rounded-xl p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                              isMe
                                ? 'bg-white/10 hover:bg-white/20 dark:bg-stone-900/10 dark:hover:bg-stone-900/20'
                                : 'bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700'
                            }`}
                          >
                            <div
                              className={`rounded-lg p-2 ${
                                isMe
                                  ? 'bg-amber-400 text-stone-900 dark:bg-stone-900 dark:text-amber-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300'
                              }`}
                            >
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold">{item.file}</p>
                              <p className="text-[11px] opacity-60">Ouvrir le fichier</p>
                            </div>
                            <ExternalLink className="h-4 w-4 shrink-0 opacity-60" />
                          </a>
                        )}

                        {/* Texte */}
                        {!voiceMsg &&
                          (isHtmlMessage ? (
                            <div
                              className="prose prose-sm max-w-none dark:prose-invert"
                              dangerouslySetInnerHTML={{ __html: item.content }}
                            />
                          ) : (
                            item.content && (
                              <p className="whitespace-pre-wrap break-words leading-relaxed">
                                {item.content}
                              </p>
                            )
                          ))}

                        <div className="mt-1 text-right text-[11px] tabular-nums opacity-60">
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

          {/* Aperçu du fichier sélectionné */}
          {selectedFile && (
            <div className="flex shrink-0 items-center justify-between border-t border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-400/20 dark:bg-amber-400/10">
              <div className="mr-2 flex min-w-0 items-center">
                <Paperclip className="mr-2 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
                <span className="truncate text-xs font-medium">{selectedFile.name}</span>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="rounded-full p-1 text-stone-500 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label="Retirer le fichier"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Saisie */}
          <form
            onSubmit={handleSendMessage}
            className="flex shrink-0 items-center gap-2 border-t border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900"
          >
            {voice.isRecording ? (
              <>
                {/* Mode enregistrement */}
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-stone-200 bg-stone-50 py-1.5 pl-1.5 pr-4 dark:border-stone-800 dark:bg-stone-950">
                  <button
                    type="button"
                    onClick={voice.cancel}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-950/40"
                    aria-label="Annuler l'enregistrement"
                    title="Annuler (Échap)"
                  >
                    <Trash2 className="h-[18px] w-[18px]" />
                  </button>

                  <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-red-500 motion-reduce:animate-none" />
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {formatTimer(voice.duration)}
                    <span className="text-stone-400"> / {formatTimer(VOICE_MAX_SECONDS)}</span>
                  </span>

                  <div className="flex h-8 min-w-0 flex-1 items-center gap-[2px]" aria-hidden="true">
                    {voice.levels.map((l, i) => (
                      <span
                        key={i}
                        style={{ height: `${Math.round(l * 100)}%` }}
                        className="w-[3px] flex-1 rounded-full bg-amber-500 transition-[height] duration-75"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVoiceSend}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500 text-stone-900 shadow-sm transition-transform hover:bg-amber-400 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
                  aria-label="Envoyer la note vocale"
                  title="Envoyer la note vocale"
                >
                  <Send className="h-[18px] w-[18px]" />
                </button>
              </>
            ) : (
              <>
                <div className="flex min-w-0 flex-1 items-center rounded-full border border-stone-200 bg-stone-50 px-2 py-1 transition-shadow focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10 dark:border-stone-800 dark:bg-stone-950">
                  <label
                    className="cursor-pointer rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-200/60 hover:text-stone-800 focus-within:ring-2 focus-within:ring-amber-500 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                    title="Joindre un fichier"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const res = await providers.API.post<UploadFileResponseDto>(
                            providers.APIUrl,
                            'media/upload-single',
                            null,
                            { file }
                          );
                          setSelectedFile(file);
                          setFileName(res.filename);
                        }
                        // permet de re-sélectionner le même fichier
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="sr-only"
                    />
                    <Paperclip className="h-5 w-5" />
                  </label>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Écrire un message"
                    className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-stone-400"
                  />
                </div>

                {hasDraft ? (
                  <button
                    type="submit"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-900 text-amber-300 shadow-sm transition-transform hover:bg-stone-800 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:bg-amber-400 dark:text-stone-900 dark:hover:bg-amber-300 dark:focus-visible:ring-offset-stone-900"
                    aria-label="Envoyer le message"
                  >
                    <Send className="h-[18px] w-[18px]" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={voice.start}
                    disabled={isUploadingVoice || !!callState}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-900 text-amber-300 shadow-sm transition-transform hover:bg-stone-800 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:bg-amber-400 dark:text-stone-900 dark:hover:bg-amber-300 dark:focus-visible:ring-offset-stone-900"
                    aria-label="Enregistrer une note vocale"
                    title="Enregistrer une note vocale"
                  >
                    {isUploadingVoice ? (
                      <Loader2 className="h-[18px] w-[18px] animate-spin" />
                    ) : (
                      <Mic className="h-[18px] w-[18px]" />
                    )}
                  </button>
                )}
              </>
            )}
          </form>
        </section>
      ) : (
        <div className="hidden flex-1 flex-col items-center justify-center bg-stone-50 text-center dark:bg-stone-950 md:flex">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
            <Send className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-medium">Choisissez une discussion</p>
          <p className="mt-1 max-w-xs text-sm text-stone-500 dark:text-stone-400">
            Sélectionnez un collaborateur dans la liste pour écrire ou envoyer une note vocale.
          </p>
        </div>
      )}

      {/* ============ MODALE D'APPEL ============ */}
      {callState?.isActive && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-stone-950/95 p-6 backdrop-blur-sm">
          <div className="z-10 mt-4 flex flex-col items-center">
            <div className="mb-2 flex items-center gap-2 rounded-full border border-stone-800 bg-stone-900 px-4 py-1.5">
              {callState.type === 'video' ? (
                <Video className="h-4 w-4 text-amber-400" />
              ) : (
                <Phone className="h-4 w-4 text-amber-400" />
              )}
              <span className="text-xs font-medium text-amber-300">
                Appel {callState.type === 'video' ? 'vidéo' : 'audio'}
              </span>
            </div>

            <p className="text-sm tabular-nums text-stone-400">
              {callState.status === 'calling' && 'Appel en cours…'}
              {callState.status === 'incoming' && 'Appel entrant…'}
              {callState.status === 'connected' && formatTimer(callDuration)}
            </p>
          </div>

          <div className="relative my-4 flex w-full max-w-2xl flex-1 items-center justify-center overflow-hidden rounded-3xl border border-stone-800 bg-stone-900 shadow-2xl">
            {callState.type === 'video' && callState.status === 'connected' ? (
              <>
                <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
                <div className="absolute bottom-4 right-4 h-44 w-32 overflow-hidden rounded-2xl border-2 border-amber-400 bg-stone-950 shadow-lg">
                  <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center">
                {callState.partner.photo ? (
                  <img
                    src={`${providers.ImageUrl}/${callState.partner.photo}`}
                    alt={callState.partner.firstname}
                    className="h-32 w-32 rounded-full border-4 border-amber-400 object-cover shadow-2xl"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-amber-400 bg-stone-800 shadow-2xl">
                    <User className="h-16 w-16 text-stone-500" />
                  </div>
                )}
                <h3 className="mt-5 text-center text-2xl font-semibold text-white">
                  {callState.partner.firstname} {callState.partner.lastname || ''}
                </h3>
              </div>
            )}
          </div>

          <div className="z-10 mb-6 w-full max-w-sm">
            {callState.status === 'incoming' ? (
              <div className="flex items-center justify-around">
                <button
                  onClick={hangUpCall}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  aria-label="Refuser l'appel"
                >
                  <Phone className="h-7 w-7 rotate-[135deg]" />
                </button>
                <button
                  onClick={acceptCall}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  aria-label="Accepter l'appel"
                >
                  <Phone className="h-7 w-7" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-6">
                <div className="flex w-full items-center justify-around rounded-3xl border border-stone-800 bg-stone-900/90 p-4">
                  <button
                    onClick={toggleMute}
                    className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                      isMuted ? 'bg-red-500 text-white' : 'bg-stone-800 text-white hover:bg-stone-700'
                    }`}
                    title={isMuted ? 'Activer le micro' : 'Couper le micro'}
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>

                  {callState.type === 'video' && (
                    <button
                      onClick={toggleVideo}
                      className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                        isVideoOff ? 'bg-red-500 text-white' : 'bg-stone-800 text-white hover:bg-stone-700'
                      }`}
                      title={isVideoOff ? 'Activer la caméra' : 'Désactiver la caméra'}
                    >
                      {isVideoOff ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                    </button>
                  )}

                  <button
                    onClick={toggleSpeaker}
                    className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                      isSpeakerOn ? 'bg-amber-400 text-stone-900' : 'bg-stone-800 text-white hover:bg-stone-700'
                    }`}
                    title={isSpeakerOn ? 'Désactiver le son' : 'Activer le son'}
                  >
                    <Volume2 className="h-5 w-5" />
                  </button>
                </div>

                <button
                  onClick={hangUpCall}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-xl transition-transform hover:scale-105 hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  title="Raccrocher"
                  aria-label="Raccrocher"
                >
                  <Phone className="h-7 w-7 rotate-[135deg]" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
