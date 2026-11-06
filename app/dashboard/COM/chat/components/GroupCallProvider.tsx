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
const PENDING_TTL_MS = 60_000;           // un invité reste "en attente" 60 s à l'écran

export type RoomType = 'audio' | 'video';

export interface Person {
  id: number;
  firstname: string;
  lastname?: string;
  photo?: string;
  Post?: { title: string };
}
export interface GroupRoom { id: string; type: RoomType; hostId: number; startedAt: number }
export interface GroupInvite { roomId: string; type: RoomType; hostId: number; caller: Person }
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

interface PeerConn {
  id: number;
  pc: RTCPeerConnection;
  polite: boolean;          // négociation parfaite : le plus grand id est "poli"
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
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  isMinimized: boolean;
  setMinimized: (v: boolean) => void;
  duration: number;
  canShareScreen: boolean;
  picker: { mode: PickerMode; preselected: number[] } | null;
  openPicker: (mode: PickerMode, preselected?: number[]) => void;
  closePicker: () => void;
  startGroup: (ids: number[], type: RoomType) => Promise<void>;
  addInvitees: (ids: number[]) => void;
  acceptInvite: () => Promise<void>;
  declineInvite: () => void;
  leave: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
  toggleScreenShare: () => Promise<void>;
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
  const call = useCallContext(); // appel 1-1 : on ne démarre pas une visio pendant un appel

  const me: any = session?.user;
  const currentUserId = Number(me?.id);
  const myProfile: Person = {
    id: currentUserId,
    firstname: me?.firstname || me?.name || '',
    lastname: me?.lastname || '',
    photo: me?.photo,
  };

  // refs "toujours à jour" : les handlers socket ne gèrent jamais de closures périmées
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
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isMinimized, setMinimized] = useState(false);
  const [duration, setDuration] = useState(0);
  const [picker, setPicker] = useState<{ mode: PickerMode; preselected: number[] } | null>(null);

  const localRef = useRef<MediaStream | null>(null);
  const screenRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<number, PeerConn>>(new Map());
  const membersRef = useRef<Set<number>>(new Set());
  const peerStreams = useRef<Map<number, Map<string, MediaStream>>>(new Map());
  const peerMedia = useRef<Map<number, PeerMedia>>(new Map());
  const profiles = useRef<Map<number, Person>>(new Map());

  const canShareScreen =
    typeof navigator !== 'undefined' && !!(navigator.mediaDevices as any)?.getDisplayMedia;

  // Sonnerie d'invitation (useRingtone est exporté par CallProvider)
  useRingtone(!!invite && !room);

  /* ---------------- Annuaire (noms des invités, sélection) ---------------- */
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

  /* ---------------- Chrono ---------------- */
  useEffect(() => {
    if (!room) { setDuration(0); return; }
    const t = setInterval(
      () => setDuration(Math.floor((Date.now() - room.startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [room?.id, room?.startedAt]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // État de mes médias (micro / caméra / flux d'écran) envoyé via le relais "signal"
  const localMedia = (): PeerMedia => {
    const a = localRef.current?.getAudioTracks()[0];
    const v = localRef.current?.getVideoTracks()[0];
    return {
      screenStreamId: screenRef.current?.id ?? null,
      muted: a ? !a.enabled : true,
      cameraOff: v ? !v.enabled : true,
    };
  };
  const sendMedia = (to?: number) => {
    const media = localMedia();
    if (to) sendSignal(to, { media });
    else membersRef.current.forEach((id) => sendSignal(id, { media }));
  };

  const applyMedia = (id: number, m: PeerMedia) => {
    const prev = peerMedia.current.get(id);
    // l'écran distant s'est arrêté : on oublie son flux pour qu'il ne passe pas pour la caméra
    if (prev?.screenStreamId && prev.screenStreamId !== m.screenStreamId) {
      peerStreams.current.get(id)?.delete(prev.screenStreamId);
    }
    peerMedia.current.set(id, m);
    refreshPeer(id);
  };

  /* ---------------- Pairs WebRTC (négociation parfaite) ---------------- */
  const addScreenTracks = (p: PeerConn) => {
    const ss = screenRef.current;
    if (!ss) return;
    ss.getTracks().forEach((t) => p.screenSenders.push(p.pc.addTrack(t, ss)));
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
    peersRef.current.delete(id);
    membersRef.current.delete(id);
    peerStreams.current.delete(id);
    peerMedia.current.delete(id);
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
          addLocalTracks(peer); // côté "déjà dans la salle" : on envoie nos médias en répondant
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
      toastRef.current.info(
        'Visioconférence',
        'Votre navigateur ne prend pas en charge les appels vidéo. Utilisez HTTPS.'
      );
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: video
          ? {
            width: { ideal: 640 },
            height: { ideal: 480 },
          }
          : false,
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
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });

          localRef.current = stream;
          setLocalStream(stream);

          setIsVideoOff(true);

          toastRef.current.info(
            'Visioconférence',
            'Caméra indisponible. Vous rejoignez avec le micro uniquement.'
          );

          return stream;
        } catch (audioError) {
          console.error('Erreur accès microphone :', audioError);
        }
      }

      toastRef.current.info(
        'Visioconférence',
        'Impossible d’accéder au microphone ou à la caméra. Vérifiez les permissions.'
      );

      return null;
    }
  };

  /* ---------------- Sortie de la salle ---------------- */
  const leaveRoom = (notify = true) => {
    const r = roomRef.current;
    if (r && notify) {
      socketRef.current?.emit('groupCall:leave', { roomId: r.id, userId: userIdRef.current });
    }
    Array.from(peersRef.current.keys()).forEach(removePeer);
    peersRef.current.clear(); membersRef.current.clear();
    peerStreams.current.clear(); peerMedia.current.clear(); profiles.current.clear();
    localRef.current?.getTracks().forEach((t) => t.stop());
    screenRef.current?.getTracks().forEach((t) => t.stop());
    localRef.current = null; screenRef.current = null;
    setLocalStream(null); setScreenStream(null); setPeers({}); setPendingIds([]);
    setIsMuted(false); setIsVideoOff(false); setIsSpeakerOn(true); setMinimized(false);
    setRoomBoth(null);
  };

  /* ---------------- Évènements socket ---------------- */
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const onInvite = (d: any) => {
      // déjà en visio ou en appel : on décline pour ne pas rester "invité"
      if (roomRef.current || callBusyRef.current) {
        socket.emit('groupCall:decline', { roomId: d.roomId, userId: currentUserId });
        return;
      }
      if (inviteRef.current?.roomId === d.roomId) return; // relecture serveur
      setMinimized(false);
      setInviteBoth({
        roomId: d.roomId,
        type: d.type === 'audio' ? 'audio' : 'video',
        hostId: Number(d.hostId),
        caller: toPerson(Number(d.hostId), d.callerProfile),
      });
    };

    // Je viens de rejoindre : je reçois les présents et j'envoie une offre à chacun
    const onPeers = (d: any) => {
      const r = roomRef.current;
      if (!r || d.roomId !== r.id) return;
      (d.peers || []).forEach((p: any) => {
        const id = Number(p.id);
        membersRef.current.add(id);
        profiles.current.set(id, toPerson(id, p.profile));
        ensurePeer(id, true);
        refreshPeer(id);
        sendMedia(id);
      });
    };

    // Quelqu'un arrive : c'est lui qui nous enverra l'offre (voir handleSignal)
    const onPeerJoined = (d: any) => {
      const r = roomRef.current;
      if (!r || d.roomId !== r.id) return;
      const id = Number(d.userId);
      membersRef.current.add(id);
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
      if (inviteRef.current?.roomId === d.roomId) setInviteBoth(null);
      if (roomRef.current?.id === d.roomId) {
        toastRef.current.info('Visioconférence', 'La visioconférence est terminée');
        leaveRoom(false);
      }
    };

    const onFull = (d: any) => {
      toastRef.current.info('Visioconférence', `Salle complète (${d?.max ?? MAX_GROUP_PARTICIPANTS} participants maximum)`);
      leaveRoom(false);
    };

    // Le serveur nous retire de la salle quand tous nos sockets sont coupés
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
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('groupCall:invite', onInvite);
      socket.off('groupCall:peers', onPeers);
      socket.off('groupCall:peerJoined', onPeerJoined);
      socket.off('groupCall:peerLeft', onPeerLeft);
      socket.off('groupCall:signal', handleSignal);
      socket.off('groupCall:ended', onEnded);
      socket.off('groupCall:full', onFull);
      socket.off('disconnect', onDisconnect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, currentUserId]);

  // Quitter la page pendant une visio = quitter la salle
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
  const openPicker = (
    mode: PickerMode,
    preselected: number[] = []
  ) => {
    if (mode === 'start' && roomRef.current) {
      toastRef.current.info(
        'Visioconférence',
        'Vous êtes déjà dans une visioconférence.'
      );
      return;
    }

    if (mode === 'start' && callBusyRef.current) {
      toastRef.current.info(
        'Visioconférence',
        'Terminez votre appel actuel avant de commencer.'
      );
      return;
    }

    setPicker({
      mode,
      preselected,
    });
  };

  const closePicker = () => {
    setPicker(null);
  };

  const startGroup = async (ids: number[], type: RoomType) => {
    const t = toastRef.current;

    try {
      const invitees = Array.from(
        new Set(ids.map(Number))
      ).filter(
        (id) => id && id !== userIdRef.current
      );

      if (!userIdRef.current) {
        t.info('Visioconférence', 'Utilisateur non identifié.');
        return;
      }

      if (roomRef.current) {
        t.info('Visioconférence', 'Une visioconférence est déjà en cours.');
        return;
      }

      if (callBusyRef.current) {
        t.info(
          'Visioconférence',
          'Terminez votre appel actuel avant de lancer une visioconférence.'
        );
        return;
      }

      if (!socketRef.current?.connected) {
        t.info(
          'Visioconférence',
          'Connexion au serveur indisponible. Veuillez réessayer.'
        );
        return;
      }

      if (
        typeof RTCPeerConnection === 'undefined' ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        t.info(
          'Visioconférence',
          'La visioconférence nécessite un navigateur compatible et HTTPS.'
        );
        return;
      }

      if (invitees.length === 0) {
        t.info(
          'Visioconférence',
          'Sélectionnez au moins un participant.'
        );
        return;
      }

      if (invitees.length > MAX_GROUP_PARTICIPANTS - 1) {
        t.info(
          'Visioconférence',
          `${MAX_GROUP_PARTICIPANTS} participants maximum, vous compris.`
        );
        return;
      }

      t.info(
        'Visioconférence',
        'Initialisation de votre visioconférence...'
      );

      const stream = await getMedia(type === 'video');

      if (!stream) return;

      const roomId = `g-${userIdRef.current}-${Date.now().toString(36)}`;

      const newRoom: GroupRoom = {
        id: roomId,
        type,
        hostId: userIdRef.current,
        startedAt: Date.now(),
      };

      setPicker(null);
      setMinimized(false);

      setRoomBoth(newRoom);

      markPending(invitees);

      socketRef.current.emit('groupCall:start', {
        roomId,
        from: userIdRef.current,
        type,
        invitees,
        profile: myProfileRef.current,
      });

      try {
        await sendGroupPush(invitees, roomId, type);
      } catch (pushError) {
        console.warn('Erreur notification push :', pushError);
      }

      console.log('Visioconférence lancée :', roomId);

    } catch (error) {
      console.error('Erreur lancement visioconférence :', error);

      leaveRoom(false);

      t.info(
        'Visioconférence',
        'Une erreur est survenue lors du démarrage de la visioconférence.'
      );
    }
  };
  const addInvitees = (ids: number[]) => {
    const r = roomRef.current;
    if (!r) return;
    const invitees = Array.from(new Set(ids.map(Number))).filter(
      (id) => id && id !== userIdRef.current && !membersRef.current.has(id));
    if (!invitees.length) return;
    socketRef.current?.emit('groupCall:addInvitees', { roomId: r.id, from: userIdRef.current, invitees });
    markPending(invitees);
    sendGroupPush(invitees, r.id, r.type);
    setPicker(null);
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
    profiles.current.set(inv.hostId, inv.caller);
    setMinimized(false);
    setRoomBoth({ id: inv.roomId, type: inv.type, hostId: inv.hostId, startedAt: Date.now() });
    // la salle doit être connue avant la réponse 'groupCall:peers'
    socketRef.current?.emit('groupCall:join', {
      roomId: inv.roomId, userId: userIdRef.current, profile: myProfileRef.current,
    });
  };

  const declineInvite = () => {
    const inv = inviteRef.current;
    if (inv) socketRef.current?.emit('groupCall:decline', { roomId: inv.roomId, userId: userIdRef.current });
    setInviteBoth(null);
  };

  const leave = () => leaveRoom(true);

  const toggleMute = () => {
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

  /* ---------------- Partage d'écran ---------------- */
  const stopScreen = () => {
    const s = screenRef.current;
    if (!s) return;
    screenRef.current = null;
    setScreenStream(null);
    peersRef.current.forEach((p) => {
      p.screenSenders.forEach((snd) => { try { p.pc.removeTrack(snd); } catch { /* déjà retiré */ } });
      p.screenSenders = [];
    });
    s.getTracks().forEach((t) => t.stop());
    sendMedia();
  };

  const toggleScreenShare = async () => {
    if (screenRef.current) { stopScreen(); return; }
    if (!roomRef.current) return;
    if (!canShareScreen) {
      toastRef.current.info('Partage d\'écran', 'Non supporté sur cet appareil');
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
        v.onended = () => stopScreen(); // bouton "Arrêter le partage" du navigateur
      }
      // les pairs pas encore négociés recevront l'écran via addLocalTracks
      peersRef.current.forEach((p) => { if (p.tracksAdded) addScreenTracks(p); });
      sendMedia(); // le flux d'écran est annoncé avant l'offre de renégociation
    } catch (e: any) {
      if (e?.name !== 'NotAllowedError') console.warn('Partage d\'écran', e);
    }
  };

  const value: Ctx = {
    room, invite, peers, pendingIds, directory, onlineUserIds, myProfile,
    localStream, screenStream, isMuted, isVideoOff, isSpeakerOn, isMinimized, setMinimized,
    duration, canShareScreen, picker, openPicker, closePicker,
    startGroup, addInvitees, acceptInvite, declineInvite, leave,
    toggleMute, toggleVideo, toggleSpeaker, toggleScreenShare,
  };

  return <GroupCallContext.Provider value={value}>{children}</GroupCallContext.Provider>;
}
