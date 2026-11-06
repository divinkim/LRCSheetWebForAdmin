'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, Video, Phone, Check, User, Users, XCircle } from 'lucide-react';
import { providers } from '@/index';
import type { Person, RoomType } from './GroupCallProvider';

interface Props {
  mode: 'start' | 'invite';
  people: Person[];
  onlineIds: number[];
  maxSelectable: number;
  preselected?: number[];
  onClose: () => void;
  onConfirm: (ids: number[], type: RoomType) => void;
}

export default function GroupCallPicker({
  mode, people, onlineIds, maxSelectable, preselected = [], onClose, onConfirm,
}: Props) {
  const [selected, setSelected] = useState<number[]>(() => preselected.slice(0, Math.max(maxSelectable, 0)));
  const [q, setQ] = useState('');
  const [type, setType] = useState<RoomType>('video');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isOnline = (id: number) => onlineIds.includes(id);
  const full = (n: number) => `${n} ${n > 1 ? 'participants' : 'participant'}`;

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return people
      .filter((p) => !s || `${p.firstname} ${p.lastname ?? ''}`.toLowerCase().includes(s))
      .sort((a, b) => Number(isOnline(b.id)) - Number(isOnline(a.id))
        || a.firstname.localeCompare(b.firstname));
  }, [people, q, onlineIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const reached = selected.length >= maxSelectable;
  const toggle = (id: number) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= maxSelectable ? p : [...p, id]));

  const selectOnline = () =>
    setSelected(list.filter((p) => isOnline(p.id)).map((p) => p.id).slice(0, maxSelectable));

  const title = mode === 'start' ? 'Nouvelle visioconférence' : 'Inviter à la visioconférence';
  const cta = mode === 'start'
    ? `Lancer avec ${full(selected.length)}`
    : `Inviter ${selected.length} ${selected.length > 1 ? 'personnes' : 'personne'}`;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className="flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">

        <div className="flex items-center justify-between bg-slate-900 px-4 py-4 dark:border-b dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">{title}</h2>
              <p className="text-[11px] text-slate-400">
                {selected.length}/{Math.max(maxSelectable, 0)} sélectionné{selected.length > 1 ? 's' : ''} · 8 participants maximum
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2.5 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center rounded-full border border-slate-200 bg-slate-100 px-3.5 dark:border-slate-700 dark:bg-slate-800">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un collaborateur…"
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100" />
            {!!q && (
              <button type="button" onClick={() => setQ('')} aria-label="Effacer la recherche">
                <XCircle className="h-4 w-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={selectOnline}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              Sélectionner les personnes en ligne
            </button>
            {selected.length > 0 && (
              <button type="button" onClick={() => setSelected([])}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                Tout désélectionner
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {maxSelectable <= 0 && (
            <p className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              La visioconférence est complète : 8 participants maximum.
            </p>
          )}
          {maxSelectable > 0 && list.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Aucun collaborateur ne correspond à votre recherche.
            </p>
          )}
          {maxSelectable > 0 && list.map((p) => {
            const on = selected.includes(p.id);
            const online = isOnline(p.id);
            const disabled = !on && reached;
            return (
              <button key={p.id} type="button" role="checkbox" aria-checked={on}
                disabled={disabled} onClick={() => toggle(p.id)}
                className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 disabled:opacity-40 dark:border-slate-800/70 ${on ? 'bg-sky-50 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}>
                <div className="relative shrink-0">
                  {p.photo ? (
                    <img src={`${providers.ImageUrl}/${p.photo}`} alt={p.firstname}
                      className="h-11 w-11 rounded-full bg-slate-100 object-cover dark:bg-slate-800" />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                      <User className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    </div>
                  )}
                  <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${online ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {p.firstname} {p.lastname || ''}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {online ? 'En ligne' : 'Hors ligne : recevra une notification'}
                    {p.Post?.title ? ` · ${p.Post.title}` : ''}
                  </p>
                </div>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${on ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                  {on && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3 border-t border-slate-200 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 dark:border-slate-800 dark:bg-slate-900">
          {mode === 'start' && (
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Type de visioconférence">
              {([['video', 'Vidéo', Video], ['audio', 'Audio seul', Phone]] as [RoomType, string, typeof Video][]).map(([k, label, Icon]) => (
                <button key={k} type="button" role="radio" aria-checked={type === k} onClick={() => setType(k)}
                  className={`flex items-center justify-center gap-2 rounded-full border py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${type === k
                    ? 'border-amber-500 bg-amber-500 text-slate-900'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'}`}>
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          )}
          <button type="button" disabled={selected.length === 0}
            onClick={() => onConfirm(selected, type)}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 active:scale-[0.99] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">
            {mode === 'start' ? (type === 'video' ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />) : <Users className="h-4 w-4" />}
            {selected.length === 0 ? 'Choisissez au moins une personne' : cta}
          </button>
        </div>
      </div>
    </div>
  );
}
