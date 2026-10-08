/**
 * fileUrl.ts (admin web) : même logique que côté client.
 * Choisit le bon dossier serveur selon l'extension.
 * Si `providers` expose VideoUrl / DocumentUrl / OthersUrl ils sont utilisés,
 * sinon on retombe sur providers.ImageUrl (comportement actuel de l'admin).
 */
import { providers } from '@/index';

export type FileKind = 'image' | 'video' | 'audio' | 'document' | 'other';

const IMAGE = /^(png|jpe?g|gif|webp|heic|heif|bmp|svg|avif)$/;
const VIDEO = /^(mp4|mov|avi|mkv|wmv|flv|m4v|mpe?g)$/;
const AUDIO = /^(m4a|aac|mp3|wav|ogg|oga|opus|amr|caf|3gp|webm|weba)$/;
const DOC = /^(pdf|docx?|xlsx?|pptx?|txt|csv|rtf|odt|ods|odp)$/;

export const getExt = (f: string) =>
  (f.split('?')[0].split('#')[0].split('.').pop() || '').toLowerCase();

export const isLocalUri = (f?: string) => !!f && /^(file|content|blob|data):/i.test(f);
export const isAudioFile = (f?: string) => !!f && AUDIO.test(getExt(f));

export const getFileKind = (file: string, isVoice = false): FileKind => {
  if (isVoice) return 'audio';
  const ext = getExt(file);
  if (IMAGE.test(ext)) return 'image';
  if (VIDEO.test(ext)) return 'video';
  if (AUDIO.test(ext)) return 'audio';
  if (DOC.test(ext)) return 'document';
  return 'other';
};

const baseFor = (kind: FileKind): string => {
  const p = providers as any;
  const image = p.ImageUrl as string;
  switch (kind) {
    case 'image': return image;
    case 'video': return p.VideoUrl ?? image;
    case 'document': return p.DocumentUrl ?? image;
    default: return p.OthersUrl ?? image; // audio / autres
  }
};

/** `kindSource` = nom d'origine (utile quand `file` est une URL blob: sans extension) */
export const resolveFileUrl = (file: string, isVoice = false, kindSource?: string) => {
  if (/^(file|content|blob|data|https?):/i.test(file)) return file;
  return `${baseFor(getFileKind(kindSource || file, isVoice))}/${file.replace(/^\/+/, '')}`;
};
