'use client';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

export const CHAT_SERVER_URL = 'https://vps118934.serveur-vps.net:8102';

interface SocketCtx {
  socket: Socket | null;
  connected: boolean;
  onlineUserIds: number[];
}
const Ctx = createContext<SocketCtx>({ socket: null, connected: false, onlineUserIds: [] });
export const useChatSocket = () => useContext(Ctx);

export default function ChatSocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userId = Number((session?.user as any)?.id);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);

  useEffect(() => {
    if (!userId) return;
    const s = io(CHAT_SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    s.on('connect', () => { s.emit('register', userId); setConnected(true); });
    s.on('disconnect', () => setConnected(false));
    s.on('usersOnline', (ids: number[]) => setOnlineUserIds(Array.isArray(ids) ? ids : []));
    setSocket(s);

    // reconnexion immédiate au retour réseau / onglet
    const wake = () => { if (!s.connected) s.connect(); };
    const onVisible = () => { if (!document.hidden) wake(); };
    window.addEventListener('online', wake);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('online', wake);
      document.removeEventListener('visibilitychange', onVisible);
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [userId]);

  const value = useMemo(() => ({ socket, connected, onlineUserIds }), [socket, connected, onlineUserIds]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
