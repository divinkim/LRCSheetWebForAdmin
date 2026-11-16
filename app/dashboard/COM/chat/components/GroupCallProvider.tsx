'use client';
import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { useSession } from 'next-auth/react';
import { providers } from '@/index';
import { useToast } from '@/components/toast';
import { UsersResponseDto } from '@/types/global';
import { useChatSocket, CHAT_SERVER_URL } from './ChatSocketProvider';
import { useCallContext, useRingtone } from './CallProvider';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export const MAX_GROUP_PARTICIPANTS = 8; // identique au serveur (mesh)
const PENDING_TTL_MS = 60_000;
export const GROUP_CALL_LOG_TITLE = 'group_call'; // valeur du champ `title` de la ligne de journal

export type RoomType = 'audio' | 'video';

export interface Person {
  id: number;
  firstname: string;
  lastname?: string;
  photo?: string;
  Post?: { title: string };
}
export interface GroupRoom {
  id: string; type: RoomType; hostId: number; startedAt: number;
  endsAt: number | null; // fin programmée (null = illimitée)
}
export interface GroupInvite {
  roomId: string; type: RoomType; hostId: number; caller: Person;
  remainingMs: number | null;
}
export interface PeerView {
  id: number;
  profile: Person;
  camStream: MediaStream | null;
  screenStream: MediaStream | null;
  muted: boolean;
  cameraOff: boolean;
  connState: RTCPeerConnectionState | 'new';
}
export type PickerMode = 'start' | 'invite';
export type ScreenTargets = number[] | 'all';

interface PeerConn {
  id: number;
  pc: RTCPeerConnection;
  polite: boolean;
  makingOffer: boolean;
  ignoreOffer: boolean;
  pendingIce: RTCIceCandidateInit[];
  screenSenders: RTCRtpSender[];
  tracksAdded: boolean;
}
interface PeerMedia { screenStreamId: string | null; muted: boolean; cameraOff: boolean }
const DEFAULT_MEDIA: PeerMedia = { screenStreamId: null, muted: false, cameraOff: false };

interface Ctx {
  room: GroupRoom | null;
  invite: GroupInvite | null;
  peers: Record<number, PeerView>;
  pendingIds: number[];
  directory: Person[];
  onlineUserIds: number[];
  myProfile: Person;
  isHost: boolean;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  screenTargetIds: ScreenTargets;
  isMuted: boolean;
  micLocked: boolean;       // micro bloqué PAR l'organisateur
  lockedIds: number[];      // (organisateur) participants dont le micro est bloqué
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  isMinimized: boolean;
  setMinimized: (v: boolean) => void;
  duration: number;
  remainingSec: number | null;
  canShareScreen: boolean;
  picker: { mode: PickerMode; preselected: number[] } | null;
  openPicker: (mode: PickerMode, preselected?: number[]) => void;
  closePicker: () => void;
  startGroup: (ids: number[], type: RoomType, durationMs?: number) => Promise<void>;
  addInvitees: (ids: number[]) => void;
  acceptInvite: () => Promise<void>;
  declineInvite: () => void;
  leave: () => void;
  kick: (id: number) => void;
  lockMic: (target: number | 'all', locked: boolean) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
  shareScreen: (targets: ScreenTargets) => Promise<void>; // démarre OU met à jour les destinataires
  stopScreen: () => void;
  subscribeGroupLogged: (fn: () => void) => () => void;
}
const GroupCallContext = createContext<Ctx | null>(null);
export const useGroupCall = () => {
  const c = useContext(GroupCallContext);
  if (!c) throw new Error('useGroupCall doit être utilisé dans <GroupCallProvider>');
  return c;
};

const configuration: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // TURN indispensable en production : en mesh, beaucoup de paires de pairs échouent sans relais
  ],
};

const toPerson = (id: number, p?: any): Person => ({
  id,
  firstname: p?.firstname || 'Collaborateur',
  lastname: p?.lastname || '',
  photo: p?.photo,
});

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */
export default function GroupCallProvider({ children }: { children: React.ReactNode }) {
  const { socket, onlineUserIds } = useChatSocket();
  const { data: session } = useSession();
  const toast = useToast();
  const call = useCallContext();

  const me: any = session?.user;
  const currentUserId = Number(me?.id);
  const myProfile: Person = {
    id: currentUserId,
    firstname: me?.firstname || me?.name || '',
    lastname: me?.lastname || '',
    photo: me?.photo,
  };

  const myProfileRef = useRef(myProfile); myProfileRef.current = myProfile;
  const userIdRef = useRef(currentUserId); userIdRef.current = currentUserId;
  const socketRef = useRef(socket); socketRef.current = socket;
  const toastRef = useRef(toast); toastRef.current = toast;
  const onlineRef = useRef(onlineUserIds); onlineRef.current = onlineUserIds;
  const callBusyRef = useRef(false); callBusyRef.current = !!call.callState;

  const [room, setRoom] = useState<GroupRoom | null>(null);
  const roomRef = useRef<GroupRoom | null>(null);
  const setRoomBoth = (r: GroupRoom | null) => { roomRef.current = r; setRoom(r); };

  const [invite, setInvite] = useState<GroupInvite | null>(null);
  const inviteRef = useRef<GroupInvite | null>(null);
  const setInviteBoth = (i: GroupInvite | null) => { inviteRef.current = i; setInvite(i); };

  const [peers, setPeers] = useState<Record<number, PeerView>>({});
  const [pendingIds, setPendingIds] = useState<number[]>([]);
  const [directory, setDirectory] = useState<Person[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [screenTargetIds, setScreenTargetIds] = useState<ScreenTargets>('all');
  const [isMuted, setIsMuted] = useState(false);
  const [micLocked, setMicLocked] = useState(false);
  const [lockedIds, setLockedIds] = useState<number[]>([]);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isMinimized, setMinimized] = useState(false);
  const [duration, setDuration] = useState(0);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [picker, setPicker] = useState<{ mode: PickerMode; preselected: number[] } | null>(null);

  const localRef = useRef<MediaStream | null>(null);
  const screenRef = useRef<MediaStream | null>(null);
  const screenTargetsRef = useRef<ScreenTargets>('all');
  const micLockedRef = useRef(false);
  const peersRef = useRef<Map<number, PeerConn>>(new Map());
  const membersRef = useRef<Set<number>>(new Set());
  const peerStreams = useRef<Map<number, Map<string, MediaStream>>>(new Map());
  const peerMedia = useRef<Map<number, PeerMedia>>(new Map());
  const profiles = useRef<Map<number, Person>>(new Map());
  const warnedRef = useRef<string | null>(null);

  // Journal (organisateur) : qui a été invité, qui a rejoint, combien de temps
  const invitedRef = useRef<Set<number>>(new Set());
  const statsRef = useRef<Map<number, { joinedAt: number | null; total: number }>>(new Map());
  const loggedRooms = useRef<Set<string>>(new Set());
  const loggedListeners = useRef<Set<() => void>>(new Set());

  const canShareScreen =
    typeof navigator !== 'undefined' && !!(navigator.mediaDevices as any)?.getDisplayMedia;

  useRingtone(!!invite && !room);

  const subscribeGroupLogged = useCallback((fn: () => void) => {
    loggedListeners.current.add(fn);
    return () => { loggedListeners.current.delete(fn); };
  }, []);
  const notifyLogged = () => loggedListeners.current.forEach((f) => f());

  /* ---------------- Notification système (hors application) ---------------- */
  const osNotifyInvite = async (inv: GroupInvite) => {
    try {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      if (!document.hidden) return; // application au premier plan : sonnerie interne
      const title = `Visioconférence ${inv.type === 'video' ? 'vidéo' : 'audio'}`;
      const opts: any = {
        body: `${inv.caller.firstname} ${inv.caller.lastname || ''} vous invite à rejoindre`.trim(),
        tag: `group-${inv.roomId}`,
        renotify: true,
        requireInteraction: true,
        vibrate: [400, 200, 400, 200, 400, 200, 400],
        data: { roomId: inv.roomId, url: '/' },
      };
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) await reg.showNotification(title, opts);
      else new Notification(title, opts);
    } catch { /* ignoré */ }
  };
  const closeOsNotif = async (roomId?: string) => {
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      const list = await reg?.getNotifications(roomId ? { tag: `group-${roomId}` } : undefined);
      list?.forEach((n) => n.close());
    } catch { /* ignoré */ }
  };

  /* ---------------- Annuaire ---------------- */
  useEffect(() => {
    if (!currentUserId) return;
    (async () => {
      try {
        const list = await providers.API.getAll<UsersResponseDto>(CHAT_SERVER_URL, 'users', null);
        setDirectory((list.data as any[]) || []);
      } catch (e) {
        console.error('Annuaire visio indisponible', e);
      }
    })();
  }, [currentUserId]);

  /* ---------------- Chrono + minuteur de fin ---------------- */
  useEffect(() => {
    if (!room) { setDuration(0); setRemainingSec(null); return; }
    const tick = () => {
      const now = Date.now();
      setDuration(Math.floor((now - room.startedAt) / 1000));
      if (room.endsAt) {
        const rem = Math.max(0, Math.ceil((room.endsAt - now) / 1000));
        setRemainingSec(rem);
        if (rem > 0 && rem <= 60 && warnedRef.current !== room.id) {
          warnedRef.current = room.id;
          toastRef.current.info('Visioconférence', 'Il reste moins d’une minute');
        }
      } else setRemainingSec(null);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [room?.id, room?.startedAt, room?.endsAt]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------- Statistiques de présence ---------------- */
  const markJoined = (id: number) => {
    const s = statsRef.current.get(id) ?? { joinedAt: null, total: 0 };
    if (!s.joinedAt) s.joinedAt = Date.now();
    statsRef.current.set(id, s);
  };
  const markLeft = (id: number) => {
    const s = statsRef.current.get(id);
    if (s?.joinedAt) { s.total += Date.now() - s.joinedAt; s.joinedAt = null; }
  };

  /**
   * Journal en base, comme pour un appel individuel : une ligne `chats` par invité
   * (expéditeur = organisateur). callDuration = secondes de présence, callStatus = a rejoint ou non.
   */
  const logGroupCall = (r: GroupRoom) => {
    if (loggedRooms.current.has(r.id)) return;
    loggedRooms.current.add(r.id);
    const meId = userIdRef.current;
    const rows = Array.from(invitedRef.current).filter((id) => id !== meId).map((id) => {
      const s = statsRef.current.get(id);
      return { id, joined: !!s, secs: Math.round((s?.total ?? 0) / 1000) };
    });
    Promise.allSettled(rows.map((row) =>
      providers.API.post(CHAT_SERVER_URL, 'chats', null, {
        title: GROUP_CALL_LOG_TITLE,
        senderId: meId,
        receiverId: row.id,
        content: '',
        file: '',
        role: 'client',
        callDuration: row.secs,
        callStatus: row.joined,
      }),
    )).then(notifyLogged);
  };

  /* ---------------- Vues des pairs ---------------- */
  const refreshPeer = useCallback((id: number) => {
    const streams = peerStreams.current.get(id);
    const m = peerMedia.current.get(id) ?? DEFAULT_MEDIA;
    let cam: MediaStream | null = null;
    let screen: MediaStream | null = null;
    Array.from(streams?.entries() ?? []).forEach(([sid, s]) => {
      if (m.screenStreamId && sid === m.screenStreamId) screen = s;
      else if (!cam) cam = s;
    });
    const profile = profiles.current.get(id) ?? { id, firstname: 'Participant' };
    const connState = peersRef.current.get(id)?.pc.connectionState ?? 'new';
    setPeers((p) => ({
      ...p,
      [id]: { id, profile, camStream: cam, screenStream: screen, muted: m.muted, cameraOff: m.cameraOff, connState },
    }));
  }, []);

  /* ---------------- Signalisation ---------------- */
  const sendSignal = (to: number, payload: any) => {
    const r = roomRef.current;
    if (!r) return;
    socketRef.current?.emit('groupCall:signal', { roomId: r.id, from: userIdRef.current, to, ...payload });
  };

  const isScreenTarget = (id: number) =>
    screenTargetsRef.current === 'all' || screenTargetsRef.current.includes(id);

  // État de mes médias, personnalisé par destinataire (le flux d'écran n'est annoncé qu'à ses destinataires)
  const localMedia = (forId?: number): PeerMedia => {
    const a = localRef.current?.getAudioTracks()[0];
    const v = localRef.current?.getVideoTracks()[0];
    const sharing = screenRef.current && (forId === undefined || isScreenTarget(forId));
    return {
      screenStreamId: sharing ? screenRef.current!.id : null,
      muted: a ? !a.enabled : true,
      cameraOff: v ? !v.enabled : true,
    };
  };
  const sendMedia = (to?: number) => {
    if (to) sendSignal(to, { media: localMedia(to) });
    else membersRef.current.forEach((id) => sendSignal(id, { media: localMedia(id) }));
  };

  const applyMedia = (id: number, m: PeerMedia) => {
    const prev = peerMedia.current.get(id);
    if (prev?.screenStreamId && prev.screenStreamId !== m.screenStreamId) {
      peerStreams.current.get(id)?.delete(prev.screenStreamId);
    }
    peerMedia.current.set(id, m);
    refreshPeer(id);
  };

  /* ---------------- Pairs WebRTC (négociation parfaite) ---------------- */
  const addScreenTracks = (p: PeerConn) => {
    const ss = screenRef.current;
    if (!ss || p.screenSenders.length || !isScreenTarget(p.id)) return;
    ss.getTracks().forEach((t) => p.screenSenders.push(p.pc.addTrack(t, ss)));
  };
  const removeScreenTracks = (p: PeerConn) => {
    p.screenSenders.forEach((snd) => { try { p.pc.removeTrack(snd); } catch { /* déjà retiré */ } });
    p.screenSenders = [];
  };
  const addLocalTracks = (p: PeerConn) => {
    if (p.tracksAdded) return;
    p.tracksAdded = true;
    const ls = localRef.current;
    ls?.getTracks().forEach((t) => p.pc.addTrack(t, ls));
    addScreenTracks(p);
  };

  const ensurePeer = (id: number, withTracks: boolean): PeerConn => {
    const existing = peersRef.current.get(id);
    if (existing) return existing;

    const pc = new RTCPeerConnection(configuration);
    const p: PeerConn = {
      id, pc, polite: userIdRef.current > id,
      makingOffer: false, ignoreOffer: false, pendingIce: [], screenSenders: [], tracksAdded: false,
    };
    peersRef.current.set(id, p);

    pc.onicecandidate = (e) => { if (e.candidate) sendSignal(id, { candidate: e.candidate.toJSON() }); };
    pc.ontrack = (e) => {
      const stream = e.streams?.[0] || new MediaStream([e.track]);
      let map = peerStreams.current.get(id);
      if (!map) { map = new Map(); peerStreams.current.set(id, map); }
      map.set(stream.id, stream);
      refreshPeer(id);
    };
    pc.onnegotiationneeded = async () => {
      try {
        p.makingOffer = true;
        await pc.setLocalDescription();
        const ld = pc.localDescription!;
        sendSignal(id, { description: { type: ld.type, sdp: ld.sdp } });
      } catch (e) {
        console.warn('Négociation', e);
      } finally {
        p.makingOffer = false;
      }
    };
    pc.onconnectionstatechange = () => {
      if (peersRef.current.get(id) !== p) return;
      if (pc.connectionState === 'failed') pc.restartIce();
      refreshPeer(id);
    };

    if (withTracks) addLocalTracks(p);
    return p;
  };

  const removePeer = (id: number) => {
    const p = peersRef.current.get(id);
    if (p) {
      p.pc.onicecandidate = null; p.pc.ontrack = null;
      p.pc.onnegotiationneeded = null; p.pc.onconnectionstatechange = null;
      p.pc.close();
    }
    markLeft(id);
    peersRef.current.delete(id);
    membersRef.current.delete(id);
    peerStreams.current.delete(id);
    peerMedia.current.delete(id);
    setLockedIds((l) => l.filter((x) => x !== id));
    setPeers((prev) => {
      const { [id]: _gone, ...rest } = prev;
      return rest;
    });
  };

  const handleSignal = async (d: any) => {
    const r = roomRef.current;
    if (!r || d.roomId !== r.id) return;
    const from = Number(d.from);
    if (!from || from === userIdRef.current) return;

    if (d.media) applyMedia(from, d.media as PeerMedia);
    if (!d.description && !d.candidate) return;

    membersRef.current.add(from);
    const peer = ensurePeer(from, false);
    const pc = peer.pc;
    try {
      if (d.description) {
        const desc = d.description as RTCSessionDescriptionInit;
        const collision = desc.type === 'offer' && (peer.makingOffer || pc.signalingState !== 'stable');
        peer.ignoreOffer = !peer.polite && collision;
        if (peer.ignoreOffer) return;

        await pc.setRemoteDescription(desc);
        for (const c of peer.pendingIce) {
          try { await pc.addIceCandidate(c); } catch (e) { console.warn('ICE', e); }
        }
        peer.pendingIce = [];

        if (desc.type === 'offer') {
          addLocalTracks(peer);
          await pc.setLocalDescription();
          const ld = pc.localDescription!;
          sendSignal(from, { description: { type: ld.type, sdp: ld.sdp } });
        }
      } else if (d.candidate) {
        if (pc.remoteDescription) {
          try { await pc.addIceCandidate(d.candidate); }
          catch (e) { if (!peer.ignoreOffer) console.warn('ICE', e); }
        } else {
          peer.pendingIce.push(d.candidate);
        }
      }
    } catch (e) {
      console.warn('Signal visio', e);
    }
  };

  /* ---------------- Médias locaux ---------------- */
  const getMedia = async (video: boolean): Promise<MediaStream | null> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toastRef.current.info('Visioconférence', 'Votre navigateur ne prend pas en charge les appels vidéo. Utilisez HTTPS.');
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: video ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
      });
      localRef.current = stream;
      setLocalStream(stream);
      setIsVideoOff(false);
      setIsMuted(false);
      return stream;
    } catch (error: any) {
      console.error('Erreur accès caméra/micro :', error);
      if (video) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localRef.current = stream;
          setLocalStream(stream);
          setIsVideoOff(true);
          toastRef.current.info('Visioconférence', 'Caméra indisponible. Vous rejoignez avec le micro uniquement.');
          return stream;
        } catch (audioError) {
          console.error('Erreur accès microphone :', audioError);
        }
      }
      toastRef.current.info('Visioconférence', 'Impossible d’accéder au microphone ou à la caméra. Vérifiez les permissions.');
      return null;
    }
  };

  /* ---------------- Sortie de la salle ---------------- */
  const leaveRoom = (notify = true) => {
    const r = roomRef.current;
    const iAmHost = !!r && r.hostId === userIdRef.current;
    if (r && notify) {
      // l'organisateur qui raccroche termine la réunion pour tout le monde
      if (iAmHost) socketRef.current?.emit('groupCall:end', { roomId: r.id, userId: userIdRef.current });
      else socketRef.current?.emit('groupCall:leave', { roomId: r.id, userId: userIdRef.current });
    }
    Array.from(peersRef.current.keys()).forEach(removePeer);
    if (r && iAmHost) logGroupCall(r); // enregistrement en base de l'appel terminé

    peersRef.current.clear(); membersRef.current.clear();
    peerStreams.current.clear(); peerMedia.current.clear(); profiles.current.clear();
    invitedRef.current.clear(); statsRef.current.clear();
    localRef.current?.getTracks().forEach((t) => t.stop());
    screenRef.current?.getTracks().forEach((t) => t.stop());
    localRef.current = null; screenRef.current = null;
    screenTargetsRef.current = 'all'; micLockedRef.current = false;
    setLocalStream(null); setScreenStream(null); setScreenTargetIds('all');
    setPeers({}); setPendingIds([]); setLockedIds([]); setMicLocked(false);
    setIsMuted(false); setIsVideoOff(false); setIsSpeakerOn(true); setMinimized(false);
    setRoomBoth(null);
    closeOsNotif();
  };

  /* ---------------- Évènements socket ---------------- */
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const onInvite = (d: any) => {
      if (roomRef.current || callBusyRef.current) {
        socket.emit('groupCall:decline', { roomId: d.roomId, userId: currentUserId });
        return;
      }
      if (inviteRef.current?.roomId === d.roomId) return;
      setMinimized(false);
      const inv: GroupInvite = {
        roomId: d.roomId,
        type: d.type === 'audio' ? 'audio' : 'video',
        hostId: Number(d.hostId),
        caller: toPerson(Number(d.hostId), d.callerProfile),
        remainingMs: typeof d.remainingMs === 'number' ? d.remainingMs : null,
      };
      setInviteBoth(inv);
      osNotifyInvite(inv);
    };

    const onPeers = (d: any) => {
      const r = roomRef.current;
      if (!r || d.roomId !== r.id) return;
      // temps restant fixé par l'organisateur
      setRoomBoth({ ...r, endsAt: typeof d.remainingMs === 'number' ? Date.now() + d.remainingMs : null });
      (d.peers || []).forEach((p: any) => {
        const id = Number(p.id);
        membersRef.current.add(id);
        profiles.current.set(id, toPerson(id, p.profile));
        ensurePeer(id, true);
        refreshPeer(id);
        sendMedia(id);
      });
    };

    const onPeerJoined = (d: any) => {
      const r = roomRef.current;
      if (!r || d.roomId !== r.id) return;
      const id = Number(d.userId);
      membersRef.current.add(id);
      invitedRef.current.add(id);
      markJoined(id);
      profiles.current.set(id, toPerson(id, d.profile));
      refreshPeer(id);
      sendMedia(id);
      setPendingIds((p) => p.filter((x) => x !== id));
    };

    const onPeerLeft = (d: any) => {
      const r = roomRef.current;
      if (!r || d.roomId !== r.id) return;
      removePeer(Number(d.userId));
    };

    const onEnded = (d: any) => {
      closeOsNotif(d.roomId);
      if (inviteRef.current?.roomId === d.roomId) setInviteBoth(null);
      if (roomRef.current?.id === d.roomId) {
        const msg =
          d.reason === 'timeout' ? 'La durée prévue est écoulée : la visioconférence est terminée'
            : d.reason === 'host_left' || d.reason === 'ended' ? 'L’organisateur a mis fin à la visioconférence'
              : 'La visioconférence est terminée';
        toastRef.current.info('Visioconférence', msg);
        leaveRoom(false);
        setTimeout(notifyLogged, 1500); // laisse le temps à l'organisateur d'écrire le journal
      }
    };

    const onFull = (d: any) => {
      toastRef.current.info('Visioconférence', `Salle complète (${d?.max ?? MAX_GROUP_PARTICIPANTS} participants maximum)`);
      leaveRoom(false);
    };

    // Retiré par l'organisateur
    const onKicked = (d: any) => {
      closeOsNotif(d?.roomId);
      if (inviteRef.current?.roomId === d?.roomId) setInviteBoth(null);
      if (roomRef.current?.id === d?.roomId) {
        toastRef.current.info('Visioconférence', 'L’organisateur vous a retiré de la visioconférence');
        leaveRoom(false);
      }
    };

    // Micro bloqué / rétabli par l'organisateur
    const onMicLock = (d: any) => {
      if (roomRef.current?.id !== d?.roomId) return;
      const locked = !!d.locked;
      micLockedRef.current = locked;
      setMicLocked(locked);
      if (locked) {
        localRef.current?.getAudioTracks().forEach((t) => (t.enabled = false));
        setIsMuted(true);
        sendMedia();
        toastRef.current.info('Visioconférence', 'L’organisateur a coupé votre micro');
      } else {
        toastRef.current.info('Visioconférence', 'Vous pouvez de nouveau activer votre micro');
      }
    };

    const onDisconnect = () => {
      if (roomRef.current) {
        toastRef.current.info('Visioconférence', 'Connexion perdue : vous avez quitté la visioconférence');
        leaveRoom(false);
      }
    };

    socket.on('groupCall:invite', onInvite);
    socket.on('groupCall:peers', onPeers);
    socket.on('groupCall:peerJoined', onPeerJoined);
    socket.on('groupCall:peerLeft', onPeerLeft);
    socket.on('groupCall:signal', handleSignal);
    socket.on('groupCall:ended', onEnded);
    socket.on('groupCall:full', onFull);
    socket.on('groupCall:kicked', onKicked);
    socket.on('groupCall:micLock', onMicLock);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('groupCall:invite', onInvite);
      socket.off('groupCall:peers', onPeers);
      socket.off('groupCall:peerJoined', onPeerJoined);
      socket.off('groupCall:peerLeft', onPeerLeft);
      socket.off('groupCall:signal', handleSignal);
      socket.off('groupCall:ended', onEnded);
      socket.off('groupCall:full', onFull);
      socket.off('groupCall:kicked', onKicked);
      socket.off('groupCall:micLock', onMicLock);
      socket.off('disconnect', onDisconnect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, currentUserId]);

  useEffect(() => () => { if (roomRef.current) leaveRoom(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------- Push pour les invités hors ligne ---------------- */
  const sendGroupPush = async (ids: number[], roomId: string, type: RoomType) => {
    const offline = ids.filter((id) => !onlineRef.current.includes(id));
    if (!offline.length) return;
    const name = `${myProfileRef.current.firstname} ${myProfileRef.current.lastname || ''}`.trim();
    await Promise.allSettled(offline.map((id) =>
      providers.API.post(CHAT_SERVER_URL, 'notification-push', null, {
        title: `Visioconférence ${type === 'video' ? 'vidéo' : 'audio'}`,
        content: `${name} vous invite à rejoindre`,
        senderId: String(userIdRef.current),
        receiverId: String(id),
        messagingType: 'group_call',
        callType: type,
        roomId,
        path: '/',
      })));
  };

  const markPending = (ids: number[]) => {
    setPendingIds((p) => Array.from(new Set([...p, ...ids])));
    setTimeout(() => setPendingIds((p) => p.filter((x) => !ids.includes(x))), PENDING_TTL_MS);
  };

  /* ---------------- Actions ---------------- */
  const openPicker = (mode: PickerMode, preselected: number[] = []) => {
    if (mode === 'start' && roomRef.current) {
      toastRef.current.info('Visioconférence', 'Vous êtes déjà dans une visioconférence.');
      return;
    }
    if (mode === 'start' && callBusyRef.current) {
      toastRef.current.info('Visioconférence', 'Terminez votre appel actuel avant de commencer.');
      return;
    }
    // la permission doit être demandée sur un geste utilisateur
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => { /* ignoré */ });
    }
    setPicker({ mode, preselected });
  };
  const closePicker = () => setPicker(null);

  const startGroup = async (ids: number[], type: RoomType, durationMs = 0) => {
    const t = toastRef.current;
    try {
      const invitees = Array.from(new Set(ids.map(Number))).filter((id) => id && id !== userIdRef.current);

      if (!userIdRef.current) return void t.info('Visioconférence', 'Utilisateur non identifié.');
      if (roomRef.current) return void t.info('Visioconférence', 'Une visioconférence est déjà en cours.');
      if (callBusyRef.current) return void t.info('Visioconférence', 'Terminez votre appel actuel avant de lancer une visioconférence.');
      if (!socketRef.current?.connected) return void t.info('Visioconférence', 'Connexion au serveur indisponible. Veuillez réessayer.');
      if (typeof RTCPeerConnection === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return void t.info('Visioconférence', 'La visioconférence nécessite un navigateur compatible et HTTPS.');
      }
      if (invitees.length === 0) return void t.info('Visioconférence', 'Sélectionnez au moins un participant.');
      if (invitees.length > MAX_GROUP_PARTICIPANTS - 1) {
        return void t.info('Visioconférence', `${MAX_GROUP_PARTICIPANTS} participants maximum, vous compris.`);
      }

      t.info('Visioconférence', 'Initialisation de votre visioconférence...');
      const stream = await getMedia(type === 'video');
      if (!stream) return;

      const roomId = `g-${userIdRef.current}-${Date.now().toString(36)}`;
      const ms = durationMs > 0 ? durationMs : 0;
      const newRoom: GroupRoom = {
        id: roomId, type, hostId: userIdRef.current, startedAt: Date.now(),
        endsAt: ms ? Date.now() + ms : null,
      };

      invitedRef.current = new Set(invitees);
      statsRef.current = new Map();
      warnedRef.current = null;

      setPicker(null);
      setMinimized(false);
      setRoomBoth(newRoom);
      markPending(invitees);

      socketRef.current.emit('groupCall:start', {
        roomId, from: userIdRef.current, type, invitees,
        profile: myProfileRef.current,
        durationMs: ms || null,
      });

      try { await sendGroupPush(invitees, roomId, type); }
      catch (pushError) { console.warn('Erreur notification push :', pushError); }
    } catch (error) {
      console.error('Erreur lancement visioconférence :', error);
      leaveRoom(false);
      t.info('Visioconférence', 'Une erreur est survenue lors du démarrage de la visioconférence.');
    }
  };

  const addInvitees = (ids: number[]) => {
    const r = roomRef.current;
    if (!r) return;
    const invitees = Array.from(new Set(ids.map(Number))).filter(
      (id) => id && id !== userIdRef.current && !membersRef.current.has(id));
    if (!invitees.length) return;
    socketRef.current?.emit('groupCall:addInvitees', { roomId: r.id, from: userIdRef.current, invitees });
    invitees.forEach((id) => invitedRef.current.add(id));
    markPending(invitees);
    sendGroupPush(invitees, r.id, r.type);
    setPicker(null);
  };

  /** Organisateur : retire un participant (ou annule l'invitation d'un invité qui sonne encore) */
  const kick = (id: number) => {
    const r = roomRef.current;
    if (!r || r.hostId !== userIdRef.current) return;
    socketRef.current?.emit('groupCall:kick', { roomId: r.id, from: userIdRef.current, target: id });
    setPendingIds((p) => p.filter((x) => x !== id));
    if (peersRef.current.has(id)) removePeer(id);
  };

  /** Organisateur : coupe + bloque (ou rétablit) le micro d'un participant ou de tous */
  const lockMic = (target: number | 'all', locked: boolean) => {
    const r = roomRef.current;
    if (!r || r.hostId !== userIdRef.current) return;
    socketRef.current?.emit('groupCall:micLock', {
      roomId: r.id, from: userIdRef.current, target, locked,
    });
    const ids = target === 'all' ? Array.from(membersRef.current) : [target];
    setLockedIds((prev) => locked
      ? Array.from(new Set([...prev, ...ids]))
      : prev.filter((x) => !ids.includes(x)));
  };

  const acceptInvite = async () => {
    const inv = inviteRef.current;
    if (!inv) return;
    if (typeof RTCPeerConnection === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toastRef.current.info('Visioconférence', 'Non supporté (HTTPS requis)');
      return declineInvite();
    }
    const stream = await getMedia(inv.type === 'video');
    if (!stream) {
      toastRef.current.info('Visioconférence', 'Permission micro/caméra refusée');
      return declineInvite();
    }
    setInviteBoth(null);
    closeOsNotif(inv.roomId);
    profiles.current.set(inv.hostId, inv.caller);
    warnedRef.current = null;
    setMinimized(false);
    setRoomBoth({
      id: inv.roomId, type: inv.type, hostId: inv.hostId, startedAt: Date.now(),
      endsAt: inv.remainingMs != null ? Date.now() + inv.remainingMs : null,
    });
    socketRef.current?.emit('groupCall:join', {
      roomId: inv.roomId, userId: userIdRef.current, profile: myProfileRef.current,
    });
  };

  const declineInvite = () => {
    const inv = inviteRef.current;
    if (inv) socketRef.current?.emit('groupCall:decline', { roomId: inv.roomId, userId: userIdRef.current });
    closeOsNotif(inv?.roomId);
    setInviteBoth(null);
  };

  const leave = () => leaveRoom(true);

  const toggleMute = () => {
    if (micLockedRef.current) {
      toastRef.current.info('Visioconférence', 'Votre micro est bloqué par l’organisateur');
      return;
    }
    localRef.current?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsMuted((m) => !m);
    sendMedia();
  };
  const toggleVideo = () => {
    if (!localRef.current?.getVideoTracks().length) return;
    localRef.current.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsVideoOff((v) => !v);
    sendMedia();
  };
  const toggleSpeaker = () => setIsSpeakerOn((s) => !s);

  /* ---------------- Partage d'écran ciblé ---------------- */
  const applyScreenTargets = () => {
    peersRef.current.forEach((p) => {
      if (isScreenTarget(p.id)) { if (p.tracksAdded) addScreenTracks(p); }
      else if (p.screenSenders.length) removeScreenTracks(p);
    });
    sendMedia(); // annonce le flux d'écran (ou son retrait) avant la renégociation
  };

  const stopScreen = () => {
    const s = screenRef.current;
    if (!s) return;
    screenRef.current = null;
    setScreenStream(null);
    peersRef.current.forEach(removeScreenTracks);
    s.getTracks().forEach((t) => t.stop());
    sendMedia();
  };

  /** Démarre le partage vers `targets`, ou met à jour les destinataires s'il est déjà actif */
  const shareScreen = async (targets: ScreenTargets) => {
    screenTargetsRef.current = targets;
    setScreenTargetIds(targets);

    if (screenRef.current) { applyScreenTargets(); return; }
    if (!roomRef.current) return;
    if (!canShareScreen) {
      toastRef.current.info('Partage d’écran', 'Non supporté sur cet appareil');
      return;
    }
    try {
      const s: MediaStream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { frameRate: 15 }, audio: true,
      });
      screenRef.current = s;
      setScreenStream(s);
      const v = s.getVideoTracks()[0];
      if (v) {
        (v as any).contentHint = 'detail';
        v.onended = () => stopScreen();
      }
      applyScreenTargets();
    } catch (e: any) {
      if (e?.name !== 'NotAllowedError') console.warn('Partage d’écran', e);
    }
  };

  const value: Ctx = {
    room, invite, peers, pendingIds, directory, onlineUserIds, myProfile,
    isHost: !!room && room.hostId === currentUserId,
    localStream, screenStream, screenTargetIds,
    isMuted, micLocked, lockedIds, isVideoOff, isSpeakerOn, isMinimized, setMinimized,
    duration, remainingSec, canShareScreen, picker, openPicker, closePicker,
    startGroup, addInvitees, acceptInvite, declineInvite, leave, kick, lockMic,
    toggleMute, toggleVideo, toggleSpeaker, shareScreen, stopScreen, subscribeGroupLogged,
  };

  return <GroupCallContext.Provider value={value}>{children}</GroupCallContext.Provider>;
}
