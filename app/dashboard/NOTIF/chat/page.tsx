'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  User, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video, Paperclip, Send, XCircle,
  ArrowLeft, Mic, FileText, ExternalLink, Search,
  Wifi, WifiOff, ChevronDown, Clock, Check, CheckCheck, AlertCircle, MessageCircle,
  Sun, Moon,
} from 'lucide-react';
import { useToast } from '@/components/toast';
import { providers } from '@/index';
import { SidebarHook } from '@/components/Layouts/sidebar/hook';
import { useCollaboratorsChat, ChatMessage } from './hook';
import { useCallContext } from '@/components/call/CallProvider';
import { useVoiceRecorder, RecordingBar, VoicePlayer, fmtMs, VOICE_MIN_MS } from './VoiceNote';
import { getFileKind, resolveFileUrl } from './fileUrl';

/* ------------------------------------------------------------------ */
/* Plein écran : recouvre sidebar + navbar du dashboard                */
/* (le modal d'appel de CallProvider doit avoir un z-index > 50)       */
/* ------------------------------------------------------------------ */
const SHELL =
  'fixed inset-0 z-50 flex h-[100dvh] w-screen overflow-hidden bg-white font-sans text-slate-800 ' +
  'dark:bg-slate-950 dark:text-slate-100';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const containsHtml = (t: string) => /<[a-z][\s\S]*>/i.test(t);

const formatHour = (d?: string) =>
  d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

const formatLastTime = (d?: string) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toDateString() === new Date().toDateString()
    ? formatHour(d)
    : date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

const dateLabelOf = (d?: string) => {
  const date = d ? new Date(d) : new Date();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  if (day === today) return "Aujourd'hui";
  if (day === today - 86400000) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const groupByDate = (list: ChatMessage[]) => {
  const groups: { label: string; items: ChatMessage[] }[] = [];
  list.forEach((m) => {
    const label = dateLabelOf(m.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(m);
    else groups.push({ label, items: [m] });
  });
  return groups;
};

const TypingDots = () => (
  <span className="flex items-center gap-[3px]" aria-label="écrit">
    {[0, 1, 2].map((i) => (
      <span key={i} style={{ animationDelay: `${i * 160}ms` }}
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400 motion-reduce:animate-none" />
    ))}
  </span>
);

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */
const CollaboratorsSkeleton = () => (
  <div className={SHELL}>
    <div className="flex w-full flex-col md:w-80 lg:w-96">
      <div className="h-32 animate-pulse bg-slate-900" />
      <div className="flex-1 space-y-1 px-4 py-3">
        {[1, 2, 3, 4, 5, 6, 7].map((k) => (
          <div key={k} className="flex animate-pulse items-center py-3">
            <div className="mr-3 h-12 w-12 shrink-0 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-44 rounded bg-slate-100 dark:bg-slate-900" />
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="hidden flex-1 bg-slate-100 dark:bg-slate-900 md:block" />
  </div>
);

/* ------------------------------------------------------------------ */
/* Bulle de message                                                    */
/* ------------------------------------------------------------------ */
const MessageBubble = React.memo(({
  item, isMe, onRetry,
}: { item: ChatMessage; isMe: boolean; onRetry: (m: ChatMessage) => void }) => {
  const time = formatHour(item.createdAt);
  const isCall = item.callDuration !== undefined && item.callDuration !== null;

  // ---- Résumé d'appel (pastille centrée)
  if (isCall) {
    const missed = item.callStatus === false;
    const Icon = missed ? PhoneMissed : isMe ? PhoneOutgoing : PhoneIncoming;
    return (
      <div className="my-2 flex justify-center">
        <div className={`flex items-center gap-2 rounded-full border px-3.5 py-2 ${
          missed
            ? 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10'
            : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'}`}>
          <Icon className={`h-3.5 w-3.5 ${missed ? 'text-red-600 dark:text-red-400' : 'text-emerald-500'}`} />
          <span className={`text-xs font-medium ${missed ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}`}>
            {missed
              ? (isMe ? 'Appel sans réponse' : 'Appel manqué')
              : `${isMe ? 'Appel sortant' : 'Appel entrant'} • ${fmtMs((item.callDuration || 0) * 1000)}`}
          </span>
          <span className="text-[10px] text-slate-400">{time}</span>
        </div>
      </div>
    );
  }

  const kind = item.file ? getFileKind(item.fileName || item.file, !!item.isVoice) : null;
  const audio = kind === 'audio';
  const image = kind === 'image';
  const fileUrl = item.file ? resolveFileUrl(item.file, !!item.isVoice, item.fileName) : '';
  const html = containsHtml(item.content ?? '');

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm md:max-w-[65%] ${
        isMe ? 'rounded-tr-none bg-blue-600 text-white'
             : 'rounded-tl-none border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
      } ${item.status === 'failed' ? 'ring-1 ring-red-400' : ''}`}>

        {audio && item.file && (
          <VoicePlayer src={fileUrl} isMe={isMe} seed={item.id} initialDurationMs={item.voiceDurationMs} />
        )}

        {image && item.file && (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="mb-1 block">
            <img src={fileUrl} alt={item.fileName || 'image'} className="h-56 w-56 rounded-xl bg-slate-200 object-cover dark:bg-slate-700" />
          </a>
        )}

        {!!item.content && (html ? (
          <div className={`prose prose-sm max-w-none ${isMe ? 'prose-invert' : 'dark:prose-invert'}`}
            dangerouslySetInnerHTML={{ __html: item.content }} />
        ) : (
          <p className={`whitespace-pre-wrap break-words leading-relaxed ${isMe ? 'font-medium' : ''}`}>{item.content}</p>
        ))}

        {!!item.file && !audio && !image && (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer"
            className={`mt-1.5 flex items-center gap-2.5 rounded-xl border p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              isMe
                ? 'border-blue-400/40 bg-blue-700/60 hover:bg-blue-700'
                : 'border-slate-300 bg-slate-100 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600'}`}>
            <div className={`rounded-lg p-2 ${isMe ? 'bg-blue-800/80 text-white' : 'bg-white text-blue-600 dark:bg-slate-800 dark:text-blue-400'}`}>
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-xs font-bold ${isMe ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                {item.fileName || item.file.split('/').pop()}
              </p>
              <p className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'}`}>Cliquer pour ouvrir</p>
            </div>
            <ExternalLink className={`h-3.5 w-3.5 shrink-0 ${isMe ? 'text-blue-300' : 'text-slate-500 dark:text-slate-400'}`} />
          </a>
        )}

        <div className="mt-1 flex items-center justify-end gap-1.5">
          {item.status === 'failed' && (
            <button type="button" onClick={() => onRetry(item)}
              className="flex items-center gap-1 text-[10px] font-semibold text-red-200 hover:text-white">
              <AlertCircle className="h-3 w-3" /> Échec · Réessayer
            </button>
          )}
          <span className={`text-[10px] tabular-nums ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>{time}</span>

          {/* Coches : uniquement sur MES messages. 1 coche verte = unread, 2 coches vertes = read */}
          {isMe && item.status !== 'failed' && (
            item.status === 'sending'
              ? <Clock className="h-2.5 w-2.5 text-blue-200" />
              : item.readStatus === 'read'
                ? <CheckCheck className="h-3.5 w-3.5 text-emerald-300" aria-label="Lu" />
                : <Check className="h-3 w-3 text-emerald-300" aria-label="Envoyé" />
          )}
        </div>
      </div>
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
type Filter = 'all' | 'unread' | 'online';

export default function ChatPage() {
  const {
    collaborators, onlineUserIds, conversations, selectedCollaborator, selectCollaborator,
    messages, inputText, setInputText, selectedFile, setSelectedFile,
    sendMessage, sendVoiceNote, retryMessage, emitTyping, typingIds,
    bumpHistory, connected, loader, currentUserId,
  } = useCollaboratorsChat();

  const { storedNotificationsArray, setStoredNotificationsArray } = SidebarHook();
  const toast = useToast();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [showFab, setShowFab] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Bloque le scroll de la page derrière le plein écran
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* ---------------- Navigation / thème ---------------- */
  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/'); // adaptez la route de repli (ex. '/dashboard')
  };
  const isDark = mounted && resolvedTheme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  /* ---------------- Appels (état global, modal rendu par CallProvider) ---------------- */
  const call = useCallContext();
  const { callState } = call;

  // Rafraîchit l'historique quand un appel vient d'être journalisé
  useEffect(() => call.subscribeCallLogged(bumpHistory), [call.subscribeCallLogged, bumpHistory]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------- Notes vocales ---------------- */
  const handleVoiceSend = async () => {
    const r = await voice.stopAndGet();
    if (r && r.durationMs > VOICE_MIN_MS) {
      sendVoiceNote(r.file, r.durationMs);
      isAtBottomRef.current = true;
      setTimeout(() => scrollToBottom(true), 50);
    } else if (r) {
      toast.info('Note vocale', 'Maintenez un peu plus longtemps pour enregistrer un message.');
    }
  };
  const voice = useVoiceRecorder((m) => toast.info('Micro', m), () => handleVoiceSend());

  useEffect(() => {
    if (!voice.isRecording) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') voice.cancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [voice.isRecording]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { voice.cancel(); }, [selectedCollaborator?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------- Scroll ---------------- */
  const scrollToBottom = (smooth = true) =>
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });

  useEffect(() => {
    if (selectedCollaborator) { isAtBottomRef.current = true; setShowFab(false); scrollToBottom(false); }
  }, [selectedCollaborator?.id]);

  useEffect(() => {
    if (messages.length > 0 && isAtBottomRef.current) scrollToBottom();
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    isAtBottomRef.current = atBottom;
    setShowFab((p) => (p === !atBottom ? p : !atBottom));
  };

  /* ---------------- Non lus ---------------- */
  // Source de vérité : la base (champ status), via conversations[id].unreadCount
  const getUnread = useCallback(
    (userId: number) => conversations[userId]?.unreadCount ?? 0,
    [conversations]);

  // Nettoie les notifications locales de la sidebar globale pour ce collaborateur
  const removeNotificationCount = (userId: number) => {
    const next = storedNotificationsArray.filter(
      (i) => !(Number(i.senderId) === userId && i.messagingType === 'chat'));
    setStoredNotificationsArray(next);
    localStorage.setItem('storedNotificationsArray', JSON.stringify(next));
  };

  /* ---------------- Liste ---------------- */
  const isUserOnline = useCallback(
    (id: number) => Array.isArray(onlineUserIds) && onlineUserIds.includes(id), [onlineUserIds]);

  const unreadTotal = useMemo(
    () => collaborators.reduce((n, c) => n + getUnread(c.id), 0),
    [collaborators, getUnread]);
  const onlineCount = useMemo(
    () => collaborators.filter((c) => isUserOnline(c.id)).length, [collaborators, isUserOnline]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return collaborators.filter((c) => {
      if (q && !`${c.firstname} ${c.lastname ?? ''}`.toLowerCase().includes(q)) return false;
      if (filter === 'unread') return getUnread(c.id) > 0;
      if (filter === 'online') return isUserOnline(c.id);
      return true;
    });
  }, [collaborators, search, filter, getUnread, isUserOnline]);

  const lastInfo = (id: number) => {
    const conv = conversations[id];
    if (conv?.lastMessage) {
      return { text: conv.lastMessage.replace(/<[^>]*>?/gm, ''), time: formatLastTime(conv.lastMessageDate) };
    }
    const online = isUserOnline(id);
    return { text: online ? 'Disponible pour discuter' : 'Hors ligne', time: online ? 'en ligne' : '' };
  };

  /* ---------------- Envoi ---------------- */
  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() && !selectedFile) return;
    sendMessage();
    isAtBottomRef.current = true;
    setTimeout(() => scrollToBottom(true), 50);
  };

  if (loader) return <CollaboratorsSkeleton />;

  const groups = groupByDate(messages);
  const partnerTyping = !!selectedCollaborator && typingIds.includes(selectedCollaborator.id);
  const inCallWithThis = !!callState && callState.partner.id === selectedCollaborator?.id;
  const callsDisabled = !!callState || !connected;
  const hasDraft = !!inputText.trim() || !!selectedFile;

  const headerBtn =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-slate-800 ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500';

  return (
    <div className={SHELL}>
      {/* ============ LISTE DES DISCUSSIONS ============ */}
      <aside className={`${selectedCollaborator ? 'hidden md:flex' : 'flex'} h-full w-full shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:w-80 lg:w-96`}>
        <div className="bg-slate-900 shadow-md dark:border-b dark:border-slate-800 dark:shadow-none">
          <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-5">
            <div className="flex min-w-0 items-center gap-2">
              <button type="button" onClick={goBack} aria-label="Retour" title="Retour"
                className={`${headerBtn} -ml-2`}>
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center">
                  <h1 className="truncate text-xl font-bold tracking-wide text-white">Discussions</h1>
                  {unreadTotal > 0 && (
                    <span className="ml-2 flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                      {unreadTotal > 99 ? '99+' : unreadTotal}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                  {connected ? <Wifi className="h-3 w-3 text-emerald-500" /> : <WifiOff className="h-3 w-3 text-red-500" />}
                  {connected ? `${onlineCount}/${collaborators.length} en ligne` : 'Reconnexion…'}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={toggleTheme}
                aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
                title={isDark ? 'Mode clair' : 'Mode sombre'}
                className={headerBtn}>
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-slate-900">LRCSheet Pro</span>
            </div>
          </div>

          <div className="px-4 pb-2.5">
            <div className="flex items-center rounded-full border border-slate-700 bg-slate-800 px-3.5">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un collaborateur…"
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-slate-500" />
              {!!search && (
                <button type="button" onClick={() => setSearch('')} aria-label="Effacer">
                  <XCircle className="h-4 w-4 text-slate-500 hover:text-slate-300" />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 px-4 pb-3">
            {([['all', 'Tous'], ['unread', 'Non lus'], ['online', 'En ligne']] as [Filter, string][]).map(([k, label]) => (
              <button key={k} type="button" onClick={() => setFilter(k)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  filter === k ? 'border-amber-500 bg-amber-500 text-slate-900' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}`}>
                {label}
              </button>
            ))}
          </div>

          {!connected && (
            <div className="flex items-center justify-center gap-2 bg-red-500/90 px-4 py-1.5 text-[11px] font-medium text-white">
              <WifiOff className="h-3 w-3" /> Connexion perdue : messages et appels indisponibles
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="mt-16 flex flex-col items-center px-8 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <MessageCircle className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Aucune discussion</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Modifiez votre recherche ou le filtre.</p>
            </div>
          )}

          {filtered.map((item) => {
            const online = isUserOnline(item.id);
            const info = lastInfo(item.id);
            const unread = getUnread(item.id);
            const conv = conversations[item.id];
            const lastIsMine = conv?.lastSenderId === currentUserId;
            const isSelected = selectedCollaborator?.id === item.id;
            return (
              <button key={item.id} type="button"
                onClick={() => { selectCollaborator(item); removeNotificationCount(item.id); }}
                className={`flex w-full items-center border-b border-slate-100 px-4 py-3.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 dark:border-slate-800/70 ${
                  isSelected
                    ? 'bg-sky-50 dark:bg-slate-800'
                    : unread > 0
                      ? 'bg-sky-50/60 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70'
                      : 'bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900'}`}>
                <div className="relative shrink-0">
                  {item.photo ? (
                    <img src={`${providers.ImageUrl}/${item.photo}`} alt={item.firstname}
                      className="h-12 w-12 rounded-full bg-slate-100 object-cover dark:bg-slate-800" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                      <User className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    </div>
                  )}
                  <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-950 ${online ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                </div>

                <div className="ml-3 min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`truncate text-base text-slate-800 dark:text-slate-100 ${unread > 0 ? 'font-bold' : 'font-semibold'}`}>
                      {item.firstname} {item.lastname || ''}
                    </span>
                    <span className={`shrink-0 text-xs font-medium ${unread > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>{info.time}</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    {typingIds.includes(item.id) ? (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">écrit…</span>
                    ) : (
                      <p className={`flex min-w-0 items-center gap-1 text-xs ${unread > 0 ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                        {/* coches seulement si le dernier message est le mien */}
                        {lastIsMine && (
                          conv?.lastReadStatus === 'read'
                            ? <CheckCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-label="Lu" />
                            : <Check className="h-3 w-3 shrink-0 text-emerald-500" aria-label="Envoyé" />
                        )}
                        <span className="truncate">{info.text}</span>
                      </p>
                    )}
                    {unread > 0 && (
                      <span className="flex h-6 min-w-[24px] shrink-0 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-semibold text-white">
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

      {/* ============ CONVERSATION ============ */}
      {selectedCollaborator ? (
        <section className="flex h-full min-w-0 flex-1 flex-col bg-slate-100 dark:bg-slate-900">
          <header className="shrink-0 bg-slate-900 shadow-sm dark:border-b dark:border-slate-800 dark:shadow-none">
            <div className="flex items-center justify-between px-3.5 py-3.5">
              <div className="flex min-w-0 flex-1 items-center">
                <button type="button" onClick={() => selectCollaborator(null)} aria-label="Retour à la liste"
                  className="mr-1 rounded-full p-2 text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 md:hidden">
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <div className="relative mr-3 shrink-0">
                  {selectedCollaborator.photo ? (
                    <img src={`${providers.ImageUrl}/${selectedCollaborator.photo}`} alt={selectedCollaborator.firstname}
                      className="h-11 w-11 rounded-full border border-slate-700 bg-slate-800 object-cover" />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
                      <User className="h-[18px] w-[18px] text-slate-400" />
                    </div>
                  )}
                  <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${
                    isUserOnline(selectedCollaborator.id) ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-white">
                    {selectedCollaborator.firstname} {selectedCollaborator.lastname || ''}
                  </h2>
                  <div className="flex items-center text-xs">
                    {inCallWithThis ? (
                      <button type="button" onClick={() => call.setMinimized(false)}
                        className="flex items-center gap-1 font-medium text-emerald-400">
                        <Phone className="h-3 w-3" /> En appel · ouvrir
                      </button>
                    ) : partnerTyping ? (
                      <span className="flex items-center gap-1.5 font-medium text-amber-400">écrit <TypingDots /></span>
                    ) : !connected ? (
                      <span className="text-red-400">Connexion…</span>
                    ) : (
                      <span className={`font-medium ${isUserOnline(selectedCollaborator.id) ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {isUserOnline(selectedCollaborator.id) ? 'en ligne' : 'hors ligne'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${connected ? 'bg-emerald-500/15' : 'bg-red-500/20'}`}>
                  {connected ? <Wifi className="h-3 w-3 text-emerald-500" /> : <WifiOff className="h-3 w-3 text-red-500" />}
                </div>
                <button type="button" disabled={callsDisabled} title="Appel audio" aria-label="Appel audio"
                  onClick={() => call.startCall(selectedCollaborator, 'audio')}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
                  <Phone className="h-4 w-4" />
                </button>
                <button type="button" disabled={callsDisabled} title="Appel vidéo" aria-label="Appel vidéo"
                  onClick={() => call.startCall(selectedCollaborator, 'video')}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
                  <Video className="h-4 w-4" />
                </button>
              </div>
            </div>
            {!connected && (
              <div className="bg-red-500/90 py-1 text-center text-[11px] font-medium text-white">Reconnexion en cours…</div>
            )}
          </header>

          {/* Messages */}
          <div className="relative min-h-0 flex-1">
            <div ref={scrollRef} onScroll={handleScroll} className="h-full space-y-2 overflow-y-auto px-3 py-3 md:px-6">
              {groups.map((g) => (
                <div key={g.label} className="space-y-2.5">
                  <div className="my-3 flex justify-center">
                    <span className="rounded-full border border-slate-300 bg-slate-200/80 px-3 py-1.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {g.label}
                    </span>
                  </div>
                  {g.items.map((item) => (
                    <MessageBubble key={item.id} item={item} isMe={item.senderId === currentUserId} onRetry={retryMessage} />
                  ))}
                </div>
              ))}
              {partnerTyping && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-none border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800"><TypingDots /></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {showFab && (
              <button type="button" aria-label="Aller en bas"
                onClick={() => { isAtBottomRef.current = true; scrollToBottom(true); setShowFab(false); }}
                className="absolute bottom-3 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-600 shadow-lg hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700">
                <ChevronDown className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Fichier en attente */}
          {selectedFile && !voice.isRecording && (
            <div className="flex shrink-0 items-center justify-between border-t border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-500/30 dark:bg-amber-500/10">
              <div className="mr-2 flex min-w-0 items-center">
                <Paperclip className="mr-2 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">{selectedFile.name}</span>
              </div>
              <button type="button" onClick={() => setSelectedFile(null)} aria-label="Retirer le fichier">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </button>
            </div>
          )}

          {/* Saisie / enregistrement */}
          <form onSubmit={handleSend} className="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-950">
            {voice.isRecording ? (
              <RecordingBar durationMs={voice.durationMs} levels={voice.levels} onCancel={voice.cancel} onSend={handleVoiceSend} />
            ) : (
              <>
                <div className="flex min-w-0 flex-1 items-center rounded-3xl border border-slate-200 bg-slate-100 px-2 py-1 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800">
                  <label className="cursor-pointer rounded-full p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 focus-within:ring-2 focus-within:ring-amber-500 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100" title="Joindre un fichier">
                    <input ref={fileInputRef} type="file" className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setSelectedFile(f); // l'envoi (upload) se fait au clic sur Envoyer
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }} />
                    <Paperclip className="h-5 w-5" />
                  </label>
                  <input type="text" value={inputText}
                    onChange={(e) => { setInputText(e.target.value); if (e.target.value) emitTyping(); }}
                    placeholder="Message…"
                    className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-base text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500" />
                </div>

                {hasDraft ? (
                  <button type="submit" aria-label="Envoyer le message"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950">
                    <Send className="h-4 w-4" />
                  </button>
                ) : (
                  <button type="button" onClick={voice.start} disabled={!!callState || !connected}
                    aria-label="Enregistrer une note vocale" title="Enregistrer une note vocale"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-95 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950">
                    <Mic className="h-[18px] w-[18px]" />
                  </button>
                )}
              </>
            )}
          </form>
        </section>
      ) : (
        <div className="hidden flex-1 flex-col items-center justify-center bg-slate-100 text-center dark:bg-slate-900 md:flex">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
            <MessageCircle className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Choisissez une discussion</p>
          <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            Sélectionnez un collaborateur pour écrire, envoyer une note vocale ou l'appeler.
          </p>
        </div>
      )}

      {/* Le modal d'appel est rendu globalement par <CallProvider /> dans le layout */}
    </div>
  );
}
