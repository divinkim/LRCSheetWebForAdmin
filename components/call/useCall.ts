/**
 * useCall.ts (admin web) : appels audio/vidéo WebRTC, même logique que le CallProvider du client
 * (file d'attente ICE, occupé, timeout de sonnerie, journalisation, réduire l'appel).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Ajoutez un serveur TURN en production
  ],
};
const RING_TIMEOUT_MS = 45000;

export interface CallPartner { id: number; firstname: string; lastname?: string; photo?: string }
export interface CallState {
  type: 'audio' | 'video';
  isIncoming: boolean;
  status: 'calling' | 'incoming' | 'connecting' | 'connected';
  partner: CallPartner;
}
export interface CallEndedInfo {
  partnerId: number; duration: number; type: 'audio' | 'video';
  isIncoming: boolean; wasConnected: boolean;
}

export const useCall = (opts: {
  socket: Socket | null;
  currentUserId: number;
  myProfile: { firstname: string; lastname?: string; photo?: string };
  onCallEnded?: (info: CallEndedInfo) => void;
  notify?: (title: string, message: string) => void;
}) => {
  const { socket, currentUserId, myProfile } = opts;

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
  const durationRef = useRef(0);
  const onEndedRef = useRef(opts.onCallEnded);
  onEndedRef.current = opts.onCallEnded;
  const notifyRef = useRef(opts.notify);
  notifyRef.current = opts.notify;

  // --- chrono
  useEffect(() => {
    if (callState?.status !== 'connected') { setDuration(0); return; }
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [callState?.status]);
  useEffect(() => { durationRef.current = duration; }, [duration]);

  const flushIce = async () => {
    for (const c of pendingIce.current) {
      try { await pcRef.current?.addIceCandidate(new RTCIceCandidate(c)); } catch (e) { console.warn('ICE', e); }
    }
    pendingIce.current = [];
  };

  const endLocal = useCallback(() => {
    const ended = callRef.current;
    callRef.current = null; // évite un double traitement
    if (ended) {
      onEndedRef.current?.({
        partnerId: ended.partner.id, duration: durationRef.current, type: ended.type,
        isIncoming: ended.isIncoming, wasConnected: ended.status === 'connected',
      });
    }
    clearTimeout(ringTimer.current);
    localRef.current?.getTracks().forEach((t) => t.stop());
    remoteRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null; localRef.current = null; remoteRef.current = null;
    offerRef.current = null; pendingIce.current = [];
    setLocalStream(null); setRemoteStream(null);
    setIsMuted(false); setIsVideoOff(false); setIsSpeakerOn(true); setMinimized(false);
    setCall(() => null);
  }, [setCall]);

  const getMedia = async (video: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
      localRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (e) {
      console.error('Accès média refusé/impossible', e);
      notifyRef.current?.('Appel', 'Permission micro/caméra refusée');
      return null;
    }
  };

  const createPC = (partnerId: number) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pc.onicecandidate = (e) => {
      if (e.candidate) socket?.emit('iceCandidate', { to: partnerId, candidate: e.candidate });
    };
    pc.ontrack = (e) => {
      if (e.streams?.[0]) { remoteRef.current = e.streams[0]; setRemoteStream(e.streams[0]); }
    };
    pc.onconnectionstatechange = () => {
      if (['failed', 'closed'].includes(pc.connectionState)) endLocal();
    };
    pcRef.current = pc;
    return pc;
  };

  // --- évènements socket
  useEffect(() => {
    if (!socket) return;

    const onIncoming = (d: any) => {
      if (callRef.current) {
        socket.emit('rejectCall', { to: d.from, from: currentUserId, reason: 'busy' });
        return;
      }
      offerRef.current = d.offer || null;
      setMinimized(false);
      setCall(() => ({
        type: d.type || 'audio', isIncoming: true, status: 'incoming',
        partner: {
          id: d.from,
          firstname: d.callerProfile?.firstname || 'Collaborateur',
          lastname: d.callerProfile?.lastname || '',
          photo: d.callerProfile?.photo,
        },
      }));
    };
    const onAnswered = async (d: { answer: RTCSessionDescriptionInit }) => {
      if (!pcRef.current || !d.answer) return;
      clearTimeout(ringTimer.current);
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(d.answer));
      await flushIce();
      setCall((p) => (p ? { ...p, status: 'connected' } : p));
    };
    const onIce = async (d: { candidate: RTCIceCandidateInit }) => {
      if (!d.candidate) return;
      if (pcRef.current?.remoteDescription) {
        try { await pcRef.current.addIceCandidate(new RTCIceCandidate(d.candidate)); } catch (e) { console.warn(e); }
      } else pendingIce.current.push(d.candidate);
    };
    const onRejected = (d: any) => {
      notifyRef.current?.('Appel', d?.reason === 'busy' ? 'Votre collaborateur est déjà en appel' : 'Appel refusé');
      endLocal();
    };

    socket.on('incomingCall', onIncoming);
    socket.on('callAnswered', onAnswered);
    socket.on('iceCandidate', onIce);
    socket.on('callRejected', onRejected);
    socket.on('callEnded', endLocal);
    return () => {
      socket.off('incomingCall', onIncoming);
      socket.off('callAnswered', onAnswered);
      socket.off('iceCandidate', onIce);
      socket.off('callRejected', onRejected);
      socket.off('callEnded', endLocal);
    };
  }, [socket, currentUserId, endLocal, setCall]);

  // Nettoyage si la page est quittée pendant un appel
  useEffect(() => () => {
    if (callRef.current && socket) {
      socket.emit('endCall', { to: callRef.current.partner.id, from: currentUserId });
    }
    localRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    clearTimeout(ringTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- actions
  const startCall = async (partner: CallPartner, type: 'audio' | 'video') => {
    if (callRef.current) return notifyRef.current?.('Appel', 'Un appel est déjà en cours');
    if (!socket?.connected) return notifyRef.current?.('Appel', 'Connexion au serveur en cours...');
    if (typeof RTCPeerConnection === 'undefined') return notifyRef.current?.('Appel', 'Appels non supportés sur ce navigateur');

    setMinimized(false);
    setCall(() => ({ type, isIncoming: false, status: 'calling', partner }));

    const stream = await getMedia(type === 'video');
    if (!stream) { endLocal(); return; }
    const pc = createPC(partner.id);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('callUser', { to: partner.id, from: currentUserId, type, offer, callerProfile: myProfile });

    ringTimer.current = setTimeout(() => {
      if (callRef.current?.status === 'calling') {
        socket.emit('endCall', { to: partner.id, from: currentUserId });
        notifyRef.current?.('Appel', 'Pas de réponse');
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
    if (!stream) { hangUp(); return; }
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

  return {
    callState, isMinimized, setMinimized, isMuted, isVideoOff, isSpeakerOn, duration,
    localStream, remoteStream,
    startCall, acceptCall, hangUp, toggleMute, toggleVideo, toggleSpeaker,
  };
};
