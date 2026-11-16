'use client';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  User, Phone, Video, Mic, MicOff, Camera, CameraOff, Volume2, VolumeX, ChevronUp,
  MonitorUp, MonitorOff, UserPlus, Users, Palette, Timer, Lock, UserMinus, X, Check, ImagePlus,
} from 'lucide-react';
import { providers } from '@/index';
import { useToast } from '@/components/toast';
import {
  useGroupCall, MAX_GROUP_PARTICIPANTS, type Person, type PeerView, type ScreenTargets,
} from './GroupCallProvider';
import GroupCallPicker from './GroupCallPicker';

const formatTimer = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
const formatRemaining = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
};
const fullName = (p: Person) => `${p.firstname} ${p.lastname || ''}`.trim();

/* ------------------------------------------------------------------ */
/* Fonds d'écran (préférence locale)                                   */
/* ------------------------------------------------------------------ */
const WALLPAPERS = [
  { id: 'default', label: 'Sombre', css: '#020617' },
  { id: 'aurora', label: 'Aurore', css: 'linear-gradient(135deg,#0f172a,#1e3a8a 60%,#0ea5e9)' },
  { id: 'dusk', label: 'Crépuscule', css: 'linear-gradient(135deg,#1e1b4b,#7c3aed 60%,#f59e0b)' },
  { id: 'forest', label: 'Forêt', css: 'linear-gradient(135deg,#052e16,#065f46 60%,#34d399)' },
  { id: 'carbon', label: 'Carbone', css: 'linear-gradient(160deg,#18181b,#3f3f46)' },
  { id: 'wine', label: 'Bordeaux', css: 'linear-gradient(135deg,#2a0a12,#7f1d1d 70%,#f43f5e)' },
];
const MAX_BG_BYTES = 2 * 1024 * 1024;

/* ------------------------------------------------------------------ */
/* Briques                                                             */
/* ------------------------------------------------------------------ */
const Avatar = ({ person, size, icon }: { person: Person; size: string; icon: string }) =>
  person.photo ? (
    <img src={`${providers.ImageUrl}/${person.photo}`} alt={person.firstname}
      className={`${size} rounded-full border-4 border-blue-600 object-cover shadow-2xl`} />
  ) : (
    <div className={`flex ${size} items-center justify-center rounded-full border-4 border-blue-600 bg-slate-800 shadow-2xl`}>
      <User className={`${icon} text-slate-500`} />
    </div>
  );

const MiniAvatar = ({ person }: { person: Person }) =>
  person.photo ? (
    <img src={`${providers.ImageUrl}/${person.photo}`} alt={person.firstname}
      className="h-9 w-9 shrink-0 rounded-full bg-slate-800 object-cover" />
  ) : (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800">
      <User className="h-4 w-4 text-slate-400" />
    </div>
  );

/** Lecteur : toujours monté pour que le son joue même quand l'image est masquée */
const MediaEl = ({
  stream, muted, mirror, contain, show,
}: { stream: MediaStream | null; muted: boolean; mirror?: boolean; contain?: boolean; show: boolean }) => {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  useEffect(() => { if (ref.current) ref.current.muted = muted; }, [muted, stream]);
  return (
    <video ref={ref} autoPlay playsInline muted={muted}
      className={show
        ? `h-full w-full ${contain ? 'object-contain' : 'object-cover'} ${mirror ? '-scale-x-100' : ''}`
        : 'sr-only'} />
  );
};

interface TileData {
  key: string;
  person: Person;
  stream: MediaStream | null;
  local: boolean;
  screen: boolean;
  showVideo: boolean;
  micOff: boolean;
  connecting: boolean;
}

const Tile = ({ t, speakerOn, large }: { t: TileData; speakerOn: boolean; large?: boolean }) => (
  <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-sm">
    <MediaEl stream={t.stream} muted={t.local || !speakerOn} show={t.showVideo}
      mirror={t.local && !t.screen} contain={t.screen} />

    {!t.showVideo && (
      <div className="absolute inset-0 flex items-center justify-center">
        <Avatar person={t.person} size={large ? 'h-28 w-28' : 'h-16 w-16 sm:h-20 sm:w-20'} icon={large ? 'h-12 w-12' : 'h-7 w-7'} />
      </div>
    )}

    <div className="absolute bottom-2 left-2 flex max-w-[85%] items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
      {t.screen
        ? <MonitorUp className="h-3 w-3 shrink-0 text-amber-400" />
        : t.micOff && <MicOff className="h-3 w-3 shrink-0 text-red-400" />}
      <span className="truncate">
        {t.screen
          ? (t.local ? 'Votre écran' : `Écran de ${t.person.firstname}`)
          : `${fullName(t.person)}${t.local ? ' (vous)' : ''}`}
      </span>
    </div>

    {t.connecting && !t.local && (
      <span className="absolute right-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-slate-900">
        Connexion…
      </span>
    )}
  </div>
);

const gridCols = (n: number) =>
  n <= 1 ? 'grid-cols-1'
    : n === 2 ? 'grid-cols-1 sm:grid-cols-2'
      : n <= 4 ? 'grid-cols-2'
        : n <= 6 ? 'grid-cols-2 md:grid-cols-3'
          : 'grid-cols-2 md:grid-cols-4';

const Ctrl = ({
  onClick, title, active, badge, children,
}: { onClick: () => void; title: string; active?: boolean; badge?: React.ReactNode; children: React.ReactNode }) => (
  <button type="button" onClick={onClick} title={title} aria-label={title} aria-pressed={!!active}
    className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:h-14 sm:w-14 ${active
      ? 'bg-white text-slate-900'
      : 'border border-slate-700 bg-slate-800 text-white hover:bg-slate-700'}`}>
    {children}
    {badge}
  </button>
);

const Backdrop = ({ onClose, children }: { onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4"
    onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/* Dialogue : choisir qui reçoit mon écran                             */
/* ------------------------------------------------------------------ */
const ShareDialog = ({
  peers, current, sharing, onConfirm, onStop, onClose,
}: {
  peers: PeerView[]; current: ScreenTargets; sharing: boolean;
  onConfirm: (t: ScreenTargets) => void; onStop: () => void; onClose: () => void;
}) => {
  const [all, setAll] = useState(current === 'all');
  const [sel, setSel] = useState<number[]>(current === 'all' ? [] : current);
  const toggle = (id: number) => setSel((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const valid = all || sel.length > 0;

  return (
    <Backdrop onClose={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Partager mon écran"
        className="flex max-h-[80dvh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h3 className="text-base font-bold">Partager mon écran avec…</h3>
          <button type="button" onClick={onClose} aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-800"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <button type="button" role="checkbox" aria-checked={all} onClick={() => setAll((v) => !v)}
            className="flex w-full items-center gap-3 border-b border-slate-800 px-4 py-3 text-left hover:bg-slate-800/60">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600"><Users className="h-4 w-4" /></span>
            <span className="flex-1 text-sm font-semibold">Tous les participants</span>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${all ? 'border-blue-600 bg-blue-600' : 'border-slate-600'}`}>
              {all && <Check className="h-3.5 w-3.5" />}
            </span>
          </button>
          {peers.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">Aucun autre participant pour l’instant.</p>
          )}
          {peers.map((p) => {
            const on = all || sel.includes(p.id);
            return (
              <button key={p.id} type="button" role="checkbox" aria-checked={on} disabled={all}
                onClick={() => toggle(p.id)}
                className="flex w-full items-center gap-3 border-b border-slate-800/70 px-4 py-3 text-left hover:bg-slate-800/60 disabled:opacity-50">
                <MiniAvatar person={p.profile} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{fullName(p.profile)}</span>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${on ? 'border-blue-600 bg-blue-600' : 'border-slate-600'}`}>
                  {on && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>
            );
          })}
        </div>
        <div className="space-y-2 border-t border-slate-800 p-3">
          <button type="button" disabled={!valid} onClick={() => onConfirm(all ? 'all' : sel)}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-2.5 text-sm font-bold hover:bg-blue-700 disabled:opacity-40">
            <MonitorUp className="h-4 w-4" /> {sharing ? 'Mettre à jour les destinataires' : 'Partager'}
          </button>
          {sharing && (
            <button type="button" onClick={onStop}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-red-600 py-2.5 text-sm font-bold hover:bg-red-700">
              <MonitorOff className="h-4 w-4" /> Arrêter le partage
            </button>
          )}
        </div>
      </div>
    </Backdrop>
  );
};

/* ------------------------------------------------------------------ */
/* Modale                                                              */
/* ------------------------------------------------------------------ */
export default function GroupCallModal() {
  const g = useGroupCall();
  const toast = useToast();
  const { room, invite, peers, picker } = g;

  const [mounted, setMounted] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [bgOpen, setBgOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [wallId, setWallId] = useState('default');
  const [customBg, setCustomBg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    try {
      setWallId(localStorage.getItem('gc-wall') || 'default');
      setCustomBg(localStorage.getItem('gc-wall-img'));
    } catch { /* stockage indisponible */ }
  }, []);

  // referme les panneaux quand la salle disparaît
  useEffect(() => {
    if (!room) { setPanelOpen(false); setShareOpen(false); setBgOpen(false); setConfirmEnd(false); }
  }, [room]);

  if (!mounted) return null;

  const pickWall = (id: string) => {
    setWallId(id);
    try { localStorage.setItem('gc-wall', id); } catch { /* ignoré */ }
  };
  const uploadWall = (f: File) => {
    if (!f.type.startsWith('image/')) return toast.info('Fond d’écran', 'Choisissez une image.');
    if (f.size > MAX_BG_BYTES) return toast.info('Fond d’écran', 'Image trop lourde (2 Mo maximum).');
    const r = new FileReader();
    r.onload = () => {
      const url = String(r.result);
      setCustomBg(url);
      setWallId('custom');
      try { localStorage.setItem('gc-wall-img', url); localStorage.setItem('gc-wall', 'custom'); } catch { /* ignoré */ }
    };
    r.readAsDataURL(f);
  };
  const wallStyle: React.CSSProperties = wallId === 'custom' && customBg
    ? { background: `center / cover no-repeat url("${customBg}")` }
    : { background: (WALLPAPERS.find((w) => w.id === wallId) ?? WALLPAPERS[0]).css };

  const peerList = Object.values(peers);
  const participantCount = peerList.length + 1;
  const isVideoRoom = room?.type === 'video';
  const sharing = !!g.screenStream;

  /* ---------- Tuiles ---------- */
  const tiles: TileData[] = [];
  if (room) {
    tiles.push({
      key: 'me', person: g.myProfile, stream: g.localStream, local: true, screen: false,
      showVideo: !!g.localStream?.getVideoTracks().length && !g.isVideoOff,
      micOff: g.isMuted, connecting: false,
    });
    if (g.screenStream) {
      tiles.push({
        key: 'me-screen', person: g.myProfile, stream: g.screenStream, local: true, screen: true,
        showVideo: true, micOff: false, connecting: false,
      });
    }
    peerList.forEach((p) => {
      tiles.push({
        key: `p${p.id}`, person: p.profile, stream: p.camStream, local: false, screen: false,
        showVideo: !!p.camStream?.getVideoTracks().length && !p.cameraOff,
        micOff: p.muted, connecting: p.connState !== 'connected',
      });
      if (p.screenStream) {
        tiles.push({
          key: `p${p.id}-s`, person: p.profile, stream: p.screenStream, local: false, screen: true,
          showVideo: true, micOff: false, connecting: false,
        });
      }
    });
  }
  // on met en avant l'écran d'un autre participant en priorité
  const spotlight = tiles.find((t) => t.screen && !t.local) ?? tiles.find((t) => t.screen);
  const others = spotlight ? tiles.filter((t) => t !== spotlight) : tiles;

  const pending = g.pendingIds
    .map((id) => g.directory.find((p) => p.id === id))
    .filter(Boolean) as Person[];

  /* ---------- Sélecteur ---------- */
  const inRoomIds = [g.myProfile.id, ...peerList.map((p) => p.id)];
  const pickerEl = picker && (
    <GroupCallPicker
      mode={picker.mode}
      people={g.directory.filter((p) => !inRoomIds.includes(p.id))}
      onlineIds={g.onlineUserIds}
      maxSelectable={MAX_GROUP_PARTICIPANTS - (picker.mode === 'invite' ? participantCount : 1)}
      preselected={picker.preselected}
      onClose={g.closePicker}
      onConfirm={(ids, type, ms) => (picker.mode === 'start' ? g.startGroup(ids, type, ms) : g.addInvitees(ids))}
    />
  );

  const allLocked = peerList.length > 0 && peerList.every((p) => g.lockedIds.includes(p.id));
  const lowTime = g.remainingSec !== null && g.remainingSec <= 60;

  return createPortal(
    <>
      {/* ---------- Invitation entrante ---------- */}
      {invite && !room && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-between bg-slate-950 p-6">
          <div className="flex w-full max-w-2xl justify-end">
            <span className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold text-slate-900">LRCSheet Pro</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-1.5">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-bold text-blue-400">
                Visioconférence {invite.type === 'video' ? 'vidéo' : 'audio'} de groupe
              </span>
            </div>
            <Avatar person={invite.caller} size="h-32 w-32" icon="h-14 w-14" />
            <h3 className="mt-5 text-2xl font-bold text-white">{fullName(invite.caller)}</h3>
            <p className="mt-1 text-sm text-slate-400">vous invite à rejoindre la réunion</p>
            {invite.remainingMs != null && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
                <Timer className="h-3.5 w-3.5" /> Durée restante : {Math.max(1, Math.round(invite.remainingMs / 60000))} min
              </p>
            )}
          </div>
          <div className="mb-6 flex w-full max-w-sm items-center justify-around">
            <button type="button" onClick={g.declineInvite} aria-label="Refuser l'invitation"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:scale-105 hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
              <Phone className="h-7 w-7 rotate-[135deg]" />
            </button>
            <button type="button" onClick={g.acceptInvite} aria-label="Rejoindre la visioconférence"
              className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:scale-105 hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 motion-reduce:animate-none">
              {invite.type === 'video' ? <Video className="h-7 w-7" /> : <Phone className="h-7 w-7" />}
            </button>
          </div>
        </div>
      )}

      {/* ---------- Bandeau réduit ---------- */}
      {room && g.isMinimized && (
        <div className="fixed inset-x-0 top-0 z-[90] flex items-center justify-between bg-emerald-600 px-4 py-2 text-white shadow-lg">
          <button type="button" onClick={() => g.setMinimized(false)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <Users className="h-4 w-4" />
            <span className="truncate text-sm font-semibold">Visioconférence</span>
            <span className="text-xs text-emerald-100">
              {participantCount} · {formatTimer(g.duration)}
              {g.remainingSec !== null && ` · reste ${formatRemaining(g.remainingSec)}`}
            </span>
            <span className="ml-2 hidden text-xs sm:inline">Cliquer pour revenir</span>
          </button>
          <button type="button" onClick={() => (g.isHost ? setConfirmEnd(true) : g.leave())}
            aria-label="Quitter la visioconférence"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 hover:bg-red-700">
            <Phone className="h-4 w-4 rotate-[135deg]" />
          </button>
        </div>
      )}

      {/* ---------- Plein écran ---------- */}
      {room && !g.isMinimized && (
        <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden" style={wallStyle}>
          <header className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-4">
            <button type="button" onClick={() => g.setMinimized(true)} aria-label="Réduire"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-800 bg-slate-900/80 text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
              <ChevronUp className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 flex-col items-center">
              <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-1.5">
                <Users className="h-3.5 w-3.5 text-blue-500" />
                <span className="truncate text-xs font-bold text-blue-400">
                  Visioconférence {isVideoRoom ? 'vidéo' : 'audio'} · {participantCount}/{MAX_GROUP_PARTICIPANTS}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-xs font-medium tabular-nums">
                <span className="text-slate-300">{formatTimer(g.duration)}</span>
                {g.remainingSec !== null && (
                  <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${lowTime ? 'bg-red-600 text-white' : 'bg-slate-900/80 text-amber-400'}`}>
                    <Timer className="h-3 w-3" /> {formatRemaining(g.remainingSec)}
                  </span>
                )}
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold text-slate-900">LRCSheet Pro</span>
          </header>

          {pending.length > 0 && (
            <p className="shrink-0 truncate px-4 pb-1 text-center text-xs text-slate-300">
              En attente de {pending.map((p) => p.firstname).join(', ')}…
            </p>
          )}

          {/* Scène */}
          <main className="min-h-0 flex-1 overflow-hidden px-3 py-2">
            {spotlight ? (
              <div className="flex h-full flex-col gap-2">
                <div className="min-h-0 flex-1"><Tile t={spotlight} speakerOn={g.isSpeakerOn} large /></div>
                <div className="flex h-24 shrink-0 gap-2 overflow-x-auto sm:h-28">
                  {others.map((t) => (
                    <div key={t.key} className="h-full w-36 shrink-0 sm:w-44">
                      <Tile t={t} speakerOn={g.isSpeakerOn} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`grid h-full w-full auto-rows-fr gap-2 overflow-y-auto ${gridCols(tiles.length)}`}>
                {tiles.map((t) => (
                  <div key={t.key} className="min-h-0"><Tile t={t} speakerOn={g.isSpeakerOn} large={tiles.length <= 2} /></div>
                ))}
              </div>
            )}
          </main>

          {/* Contrôles */}
          <footer className="shrink-0 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
            <div className="mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-2.5 rounded-3xl border border-slate-800 bg-slate-900/90 p-3 backdrop-blur sm:gap-3">
              <Ctrl onClick={g.toggleMute} active={g.isMuted}
                title={g.micLocked ? 'Micro bloqué par l’organisateur' : g.isMuted ? 'Activer le micro' : 'Couper le micro'}
                badge={g.micLocked ? <Lock className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-red-600 p-0.5 text-white" /> : undefined}>
                {g.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Ctrl>
              {isVideoRoom && (
                <Ctrl onClick={g.toggleVideo} active={g.isVideoOff} title={g.isVideoOff ? 'Activer la caméra' : 'Désactiver la caméra'}>
                  {g.isVideoOff ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                </Ctrl>
              )}
              {g.canShareScreen && (
                <Ctrl onClick={() => setShareOpen(true)} active={sharing}
                  title={sharing ? 'Partage d’écran : modifier ou arrêter' : 'Partager mon écran'}>
                  {sharing ? <MonitorOff className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
                </Ctrl>
              )}
              <Ctrl onClick={g.toggleSpeaker} active={!g.isSpeakerOn} title={g.isSpeakerOn ? 'Couper le son' : 'Activer le son'}>
                {g.isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Ctrl>
              <Ctrl onClick={() => setPanelOpen((v) => !v)} active={panelOpen} title="Participants">
                <Users className="h-5 w-5" />
              </Ctrl>
              <Ctrl onClick={() => g.openPicker('invite')} title="Ajouter des participants">
                <UserPlus className="h-5 w-5" />
              </Ctrl>
              <Ctrl onClick={() => setBgOpen((v) => !v)} active={bgOpen} title="Fond d’écran">
                <Palette className="h-5 w-5" />
              </Ctrl>
              <button type="button" onClick={() => (g.isHost ? setConfirmEnd(true) : g.leave())}
                title={g.isHost ? 'Terminer pour tous' : 'Quitter la visioconférence'}
                aria-label={g.isHost ? 'Terminer la visioconférence pour tous' : 'Quitter la visioconférence'}
                className="flex h-12 w-14 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-xl hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:h-14 sm:w-16">
                <Phone className="h-6 w-6 rotate-[135deg]" />
              </button>
            </div>
          </footer>

          {/* Fond d'écran */}
          {bgOpen && (
            <div className="absolute bottom-24 left-1/2 z-[105] w-[min(92vw,22rem)] -translate-x-1/2 rounded-2xl border border-slate-700 bg-slate-900/95 p-3 text-white shadow-2xl backdrop-blur">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold">Fond d’écran</p>
                <button type="button" onClick={() => setBgOpen(false)} aria-label="Fermer"
                  className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-800"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {WALLPAPERS.map((w) => (
                  <button key={w.id} type="button" onClick={() => pickWall(w.id)} aria-pressed={wallId === w.id}
                    className={`h-14 rounded-xl border-2 text-[10px] font-semibold ${wallId === w.id ? 'border-amber-500' : 'border-slate-700'}`}
                    style={{ background: w.css }}>
                    <span className="rounded bg-black/50 px-1">{w.label}</span>
                  </button>
                ))}
                <button type="button" onClick={() => fileRef.current?.click()}
                  className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed text-[10px] font-semibold ${wallId === 'custom' ? 'border-amber-500' : 'border-slate-600'}`}
                  style={wallId === 'custom' && customBg ? { background: `center / cover url("${customBg}")` } : undefined}>
                  <ImagePlus className="h-4 w-4" />
                  <span className="rounded bg-black/50 px-1">Mon image</span>
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadWall(f); e.target.value = ''; }} />
              <p className="mt-2 text-[11px] text-slate-400">Visible uniquement chez vous.</p>
            </div>
          )}

          {/* Panneau des participants */}
          {panelOpen && (
            <aside className="absolute inset-y-0 right-0 z-[105] flex w-full max-w-xs flex-col border-l border-slate-800 bg-slate-950/95 text-white shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <h3 className="text-sm font-bold">Participants ({participantCount})</h3>
                <button type="button" onClick={() => setPanelOpen(false)} aria-label="Fermer"
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-800"><X className="h-4 w-4" /></button>
              </div>

              {g.isHost && peerList.length > 0 && (
                <div className="border-b border-slate-800 p-3">
                  <button type="button" onClick={() => g.lockMic('all', !allLocked)}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-800 py-2 text-xs font-semibold hover:bg-slate-700">
                    {allLocked ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    {allLocked ? 'Rétablir les micros de tous' : 'Couper les micros de tous'}
                  </button>
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="flex items-center gap-3 border-b border-slate-800/70 px-4 py-3">
                  <MiniAvatar person={g.myProfile} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{fullName(g.myProfile)} (vous)</p>
                    {g.isHost && <p className="text-[11px] text-amber-400">Organisateur</p>}
                  </div>
                  {g.isMuted && <MicOff className="h-4 w-4 text-red-400" />}
                </div>

                {peerList.map((p) => {
                  const locked = g.lockedIds.includes(p.id);
                  return (
                    <div key={p.id} className="flex items-center gap-2 border-b border-slate-800/70 px-4 py-3">
                      <MiniAvatar person={p.profile} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{fullName(p.profile)}</p>
                        <p className="text-[11px] text-slate-400">
                          {p.id === room?.hostId ? 'Organisateur · ' : ''}{p.connState === 'connected' ? 'Connecté' : 'Connexion…'}
                        </p>
                      </div>
                      {p.muted && <MicOff className="h-4 w-4 shrink-0 text-red-400" />}
                      {g.isHost && (
                        <>
                          <button type="button" onClick={() => g.lockMic(p.id, !locked)}
                            title={locked ? 'Rétablir le micro' : 'Couper et bloquer le micro'}
                            aria-label={locked ? 'Rétablir le micro' : 'Couper et bloquer le micro'}
                            aria-pressed={locked}
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${locked ? 'bg-red-600' : 'bg-slate-800 hover:bg-slate-700'}`}>
                            {locked ? <Lock className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                          </button>
                          <button type="button" onClick={() => g.kick(p.id)}
                            title="Retirer de la réunion" aria-label={`Retirer ${p.profile.firstname}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-red-400 hover:bg-red-600 hover:text-white">
                            <UserMinus className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}

                {pending.map((p) => (
                  <div key={`w${p.id}`} className="flex items-center gap-2 border-b border-slate-800/70 px-4 py-3 opacity-70">
                    <MiniAvatar person={p} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{fullName(p)}</p>
                      <p className="text-[11px] text-amber-400">En attente…</p>
                    </div>
                    {g.isHost && (
                      <button type="button" onClick={() => g.kick(p.id)} title="Annuler l’invitation"
                        aria-label={`Annuler l’invitation de ${p.firstname}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-red-400 hover:bg-red-600 hover:text-white">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-800 p-3">
                <button type="button" onClick={() => g.openPicker('invite')}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-2.5 text-sm font-bold hover:bg-blue-700">
                  <UserPlus className="h-4 w-4" /> Ajouter des participants
                </button>
              </div>
            </aside>
          )}
        </div>
      )}

      {/* Partage d'écran ciblé */}
      {room && shareOpen && (
        <ShareDialog
          peers={peerList}
          current={g.screenTargetIds}
          sharing={sharing}
          onClose={() => setShareOpen(false)}
          onConfirm={(t) => { setShareOpen(false); g.shareScreen(t); }}
          onStop={() => { setShareOpen(false); g.stopScreen(); }}
        />
      )}

      {/* Confirmation : l'organisateur termine pour tous */}
      {room && confirmEnd && (
        <Backdrop onClose={() => setConfirmEnd(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="end-title"
            className="w-full max-w-sm rounded-2xl bg-slate-900 p-5 text-white shadow-2xl">
            <h3 id="end-title" className="text-base font-bold">Terminer la visioconférence ?</h3>
            <p className="mt-1.5 text-sm text-slate-400">
              Comme vous êtes l’organisateur, la réunion s’arrêtera pour tous les participants.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmEnd(false)}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800">Annuler</button>
              <button type="button" autoFocus onClick={() => { setConfirmEnd(false); g.leave(); }}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700">Terminer pour tous</button>
            </div>
          </div>
        </Backdrop>
      )}

      {pickerEl}
    </>,
    document.body
  );
}
