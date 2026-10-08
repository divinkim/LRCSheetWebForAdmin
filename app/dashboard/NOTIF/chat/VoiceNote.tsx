'use client';
/**
 * VoiceNote.tsx (admin web) : mêmes briques que le client mobile
 *  - useVoiceRecorder : enregistrement + niveau sonore en direct (MediaRecorder)
 *  - RecordingBar     : poubelle / chrono / ondes / envoyer
 *  - VoicePlayer      : play, ondes cliquables, vitesse 1x / 1.5x / 2x
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Send, Trash2 } from 'lucide-react';

export const fmtMs = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const BARS = 36;
export const VOICE_MAX_MS = 5 * 60 * 1000;
export const VOICE_MIN_MS = 700;

const pickMime = () => {
  if (typeof MediaRecorder === 'undefined') return '';
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
    .find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
};
const extFor = (m: string) => (m.includes('mp4') ? 'm4a' : m.includes('ogg') ? 'ogg' : 'webm');

// ------------------------------------------------------------------ Enregistreur
export const useVoiceRecorder = (onError: (m: string) => void, onMax: () => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0.08));

  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null);
  const startRef = useRef(0);
  const lastTick = useRef(0);
  const cancelledRef = useRef(false);
  const mimeRef = useRef('');
  const onErrRef = useRef(onError); onErrRef.current = onError;
  const onMaxRef = useRef(onMax); onMaxRef.current = onMax;

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    clearInterval(timerRef.current);
    rafRef.current = null; timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null; recRef.current = null; chunksRef.current = [];
    setIsRecording(false); setDurationMs(0); setLevels(Array(BARS).fill(0.08));
  }, []);

  const start = useCallback(async () => {
    if (recRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      onErrRef.current("L'enregistrement audio n'est pas pris en charge sur ce navigateur.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      cancelledRef.current = false;
      chunksRef.current = [];
      const mime = pickMime();
      mimeRef.current = mime;
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 64000 } : undefined);
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recRef.current = rec;

      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        ctxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const buf = new Uint8Array(analyser.fftSize);
        const tick = (t: number) => {
          rafRef.current = requestAnimationFrame(tick);
          if (t - lastTick.current < 70) return;
          lastTick.current = t;
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
          const lvl = Math.min(1, Math.max(0.08, Math.sqrt(sum / buf.length) * 4));
          setLevels((p) => [...p.slice(1), lvl]);
        };
        rafRef.current = requestAnimationFrame(tick);
      }

      rec.start(250);
      startRef.current = Date.now();
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        const el = Date.now() - startRef.current;
        setDurationMs(el);
        if (el >= VOICE_MAX_MS) onMaxRef.current();
      }, 200);
    } catch (err: any) {
      cleanup();
      onErrRef.current(err?.name === 'NotAllowedError'
        ? 'Accès au micro refusé. Autorisez-le dans les réglages du navigateur.'
        : "Impossible de démarrer l'enregistrement.");
    }
  }, [cleanup]);

  const stopAndGet = useCallback(
    () => new Promise<{ file: File; durationMs: number } | null>((resolve) => {
      const rec = recRef.current;
      if (!rec || rec.state === 'inactive') return resolve(null);
      const elapsed = Date.now() - startRef.current;
      rec.onstop = () => {
        const base = (rec.mimeType || mimeRef.current || 'audio/webm').split(';')[0];
        const blob = new Blob(chunksRef.current, { type: base });
        const cancelled = cancelledRef.current;
        cleanup();
        if (cancelled || blob.size === 0) return resolve(null);
        resolve({ file: new File([blob], `voice_${Date.now()}.${extFor(base)}`, { type: base }), durationMs: elapsed });
      };
      rec.stop();
    }), [cleanup]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    const rec = recRef.current;
    if (rec && rec.state !== 'inactive') { rec.onstop = () => cleanup(); rec.stop(); } else cleanup();
  }, [cleanup]);

  useEffect(() => () => cancel(), [cancel]);

  return { isRecording, durationMs, levels, start, stopAndGet, cancel };
};

// ------------------------------------------------------------------ Barre d'enregistrement
export const RecordingBar = ({
  durationMs, levels, onCancel, onSend,
}: { durationMs: number; levels: number[]; onCancel: () => void; onSend: () => void }) => (
  <>
    <button type="button" onClick={onCancel} title="Annuler (Échap)" aria-label="Annuler l'enregistrement"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
      <Trash2 className="h-[18px] w-[18px]" />
    </button>

    <div className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full border border-slate-200 bg-slate-100 px-4">
      <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-red-500 motion-reduce:animate-none" />
      <span className="w-20 shrink-0 text-sm font-semibold tabular-nums text-slate-700">
        {fmtMs(durationMs)}<span className="text-slate-400"> / {fmtMs(VOICE_MAX_MS)}</span>
      </span>
      <div className="flex h-7 min-w-0 flex-1 items-center justify-end gap-[2px]" aria-hidden="true">
        {levels.map((l, i) => (
          <span key={i} style={{ height: `${Math.round(l * 100)}%` }}
            className="w-[3px] flex-1 rounded-full bg-blue-600 transition-[height] duration-75" />
        ))}
      </div>
    </div>

    <button type="button" onClick={onSend} title="Envoyer la note vocale" aria-label="Envoyer la note vocale"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
      <Send className="h-[18px] w-[18px]" />
    </button>
  </>
);

// ------------------------------------------------------------------ Lecteur
let activeAudio: HTMLAudioElement | null = null; // un seul vocal à la fois
const SPEEDS = [1, 1.5, 2];

const makeBars = (seed: number) => {
  let x = (Math.abs(seed) % 9973) + 7;
  return Array.from({ length: BARS }, () => {
    x = (x * 9301 + 49297) % 233280;
    return 0.25 + (x / 233280) * 0.75;
  });
};

export const VoicePlayer = ({
  src, isMe, seed, initialDurationMs,
}: { src: string; isMe: boolean; seed: number; initialDurationMs?: number }) => {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0); // secondes
  const [realDur, setRealDur] = useState<number | null>(null);
  const [speed, setSpeed] = useState(0);
  const bars = useMemo(() => makeBars(seed), [seed]);

  // Les .webm du navigateur n'ont souvent pas de durée dans les métadonnées
  const total = initialDurationMs ? initialDurationMs / 1000 : realDur ?? 0;
  const ratio = total > 0 ? Math.min(1, cur / total) : 0;

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      if (activeAudio && activeAudio !== el) activeAudio.pause();
      activeAudio = el;
      el.playbackRate = SPEEDS[speed];
      el.play().catch(() => setPlaying(false));
    } else el.pause();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || total <= 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * total;
    el.currentTime = t; setCur(t);
  };

  const cycle = () => {
    const n = (speed + 1) % SPEEDS.length;
    setSpeed(n);
    if (ref.current) ref.current.playbackRate = SPEEDS[n];
  };

  const active = isMe ? 'bg-white' : 'bg-blue-600';
  const idle = isMe ? 'bg-white/40' : 'bg-slate-300';

  return (
    <div className="flex w-60 items-center gap-3 py-1 sm:w-72">
      <audio
        ref={ref} src={src} preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCur(0); }}
        onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          if (Number.isFinite(el.duration)) setRealDur(el.duration);
          else { // astuce webm : forcer le calcul de la durée
            el.currentTime = 1e101;
            el.ontimeupdate = () => { el.ontimeupdate = null; if (Number.isFinite(el.duration)) setRealDur(el.duration); el.currentTime = 0; };
          }
        }}
      />
      <button type="button" onClick={toggle} aria-label={playing ? 'Mettre en pause' : 'Écouter la note vocale'}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
          isMe ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
        {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
      </button>

      <div className="min-w-0 flex-1">
        <div onClick={seek} role="slider" aria-label="Position de lecture"
          aria-valuemin={0} aria-valuemax={Math.round(total)} aria-valuenow={Math.round(cur)}
          className="flex h-7 cursor-pointer items-center gap-[2px]">
          {bars.map((h, i) => (
            <span key={i} style={{ height: `${Math.round(h * 100)}%` }}
              className={`w-[3px] flex-1 rounded-full ${i / bars.length < ratio ? active : idle}`} />
          ))}
        </div>
        <span className={`text-[10px] tabular-nums ${isMe ? 'text-blue-100' : 'text-slate-500'}`}>
          {fmtMs((playing || cur > 0 ? cur : total) * 1000)}
        </span>
      </div>

      {(playing || cur > 0 || speed !== 0) && (
        <button type="button" onClick={cycle} aria-label="Changer la vitesse de lecture"
          className={`rounded-full px-2 py-1 text-[10px] font-bold ${isMe ? 'bg-blue-800/70 text-white' : 'bg-slate-100 text-slate-600'}`}>
          {SPEEDS[speed]}x
        </button>
      )}
    </div>
  );
};
