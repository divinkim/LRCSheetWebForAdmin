'use client';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  User, Phone, Video, Mic, MicOff, Camera, CameraOff, Volume2, VolumeX, ChevronUp,
  MonitorUp, MonitorOff, UserPlus, Users,
} from 'lucide-react';
import { providers } from '@/index';
import {
  useGroupCall, MAX_GROUP_PARTICIPANTS, type Person,
} from './GroupCallProvider';
import GroupCallPicker from './GroupCallPicker';

const formatTimer = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
const fullName = (p: Person) => `${p.firstname} ${p.lastname || ''}`.trim();

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
  <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
    <MediaEl stream={t.stream} muted={t.local || !speakerOn} show={t.showVideo}
      mirror={t.local && !t.screen} contain={t.screen} />

    {!t.showVideo && (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
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
  onClick, title, active, children,
}: { onClick: () => void; title: string; active?: boolean; children: React.ReactNode }) => (
  <button type="button" onClick={onClick} title={title} aria-label={title} aria-pressed={!!active}
    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:h-14 sm:w-14 ${active
      ? 'bg-white text-slate-900'
      : 'border border-slate-700 bg-slate-800 text-white hover:bg-slate-700'}`}>
    {children}
  </button>
);

/* ------------------------------------------------------------------ */
/* Modale                                                              */
/* ------------------------------------------------------------------ */
export default function GroupCallModal() {
  const g = useGroupCall();
  const { room, invite, peers, picker } = g;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const peerList = Object.values(peers);
  const participantCount = peerList.length + 1;
  const isVideoRoom = room?.type === 'video';

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
  const spotlight = tiles.find((t) => t.screen);
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
      onConfirm={(ids, type) => (picker.mode === 'start' ? g.startGroup(ids, type) : g.addInvitees(ids))}
    />
  );

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
            <span className="text-xs text-emerald-100">{participantCount} · {formatTimer(g.duration)}</span>
            <span className="ml-2 hidden text-xs sm:inline">Cliquer pour revenir</span>
          </button>
          <button type="button" onClick={g.leave} aria-label="Quitter la visioconférence"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 hover:bg-red-700">
            <Phone className="h-4 w-4 rotate-[135deg]" />
          </button>
        </div>
      )}

      {/* ---------- Plein écran ---------- */}
      {room && !g.isMinimized && (
        <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-slate-950">
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
              <span className="mt-1.5 text-xs font-medium tabular-nums text-slate-300">{formatTimer(g.duration)}</span>
            </div>
            <span className="shrink-0 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold text-slate-900">LRCSheet Pro</span>
          </header>

          {pending.length > 0 && (
            <p className="shrink-0 truncate px-4 pb-1 text-center text-xs text-slate-400">
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
              <Ctrl onClick={g.toggleMute} active={g.isMuted} title={g.isMuted ? 'Activer le micro' : 'Couper le micro'}>
                {g.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Ctrl>
              {isVideoRoom && (
                <Ctrl onClick={g.toggleVideo} active={g.isVideoOff} title={g.isVideoOff ? 'Activer la caméra' : 'Désactiver la caméra'}>
                  {g.isVideoOff ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                </Ctrl>
              )}
              {g.canShareScreen && (
                <Ctrl onClick={g.toggleScreenShare} active={!!g.screenStream}
                  title={g.screenStream ? 'Arrêter le partage d\'écran' : 'Partager mon écran'}>
                  {g.screenStream ? <MonitorOff className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
                </Ctrl>
              )}
              <Ctrl onClick={g.toggleSpeaker} active={!g.isSpeakerOn} title={g.isSpeakerOn ? 'Couper le son' : 'Activer le son'}>
                {g.isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Ctrl>
              <Ctrl onClick={() => g.openPicker('invite')} title="Inviter des participants">
                <UserPlus className="h-5 w-5" />
              </Ctrl>
              <button type="button" onClick={g.leave} title="Quitter la visioconférence" aria-label="Quitter la visioconférence"
                className="flex h-12 w-14 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-xl hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:h-14 sm:w-16">
                <Phone className="h-6 w-6 rotate-[135deg]" />
              </button>
            </div>
          </footer>
        </div>
      )}

      {pickerEl}
    </>,
    document.body
  );
}
