/**
 * fileUrl.ts (admin web)
 * Choisit le bon dossier serveur selon le type de fichier :
 *   images    -> /api/media/uploads/images
 *   audio     -> /api/media/uploads/audios
 *   autres    -> /api/media/uploads/others
 * Si `providers` expose AudioUrl / VideoUrl / DocumentUrl / OthersUrl ils sont utilisés,
 * sinon on les déduit de providers.ImageUrl (…/uploads/images => …/uploads/audios, etc.).
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

/** Remplace le dernier segment `/images` de ImageUrl par le dossier voulu */
const sibling = (imageUrl: string, folder: string) =>
  imageUrl.replace(/\/images\/?$/, `/${folder}`);

const baseFor = (kind: FileKind): string => {
  const p = providers as any;
  const image = String(p.ImageUrl);
  switch (kind) {
    case 'image': return image;
    case 'audio': return p.AudioUrl ?? sibling(image, 'audios');
    case 'video': return p.VideoUrl ?? p.OthersUrl ?? sibling(image, 'others');
    case 'document': return p.DocumentUrl ?? p.OthersUrl ?? sibling(image, 'others');
    default: return p.OthersUrl ?? sibling(image, 'others');
  }
};

/** `kindSource` = nom d'origine (utile quand `file` est une URL blob: sans extension) */
export const resolveFileUrl = (file: string, isVoice = false, kindSource?: string) => {
  if (/^(file|content|blob|data|https?):/i.test(file)) return file;
  return `${baseFor(getFileKind(kindSource || file, isVoice))}/${file.replace(/^\/+/, '')}`;
};