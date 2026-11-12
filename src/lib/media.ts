/*
 * Rodzaje plików w portfolio (wspólne dla serwera i przeglądarki).
 * Zdjęcia (JPG/PNG/WebP/AVIF) są zmniejszane do 1920 × 1080 i zapisywane jako WebP.
 * GIF i wideo (MP4/WebM/MOV) idą bez przeróbek — na Vercelu prosto z przeglądarki do Vercel Blob,
 * bo zwykłe żądanie przyjmuje max ~4,5 MB.
 */

export const RAW_TYPES: Record<string, string> = { "image/gif": "gif", "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const ACCEPT_MEDIA = [...IMAGE_TYPES, ...Object.keys(RAW_TYPES)].join(",");
export const MAX_RAW_BYTES = 300 * 1024 * 1024;

export const isRawType = (type: string) => type in RAW_TYPES;
export const isMediaType = (type: string) => IMAGE_TYPES.includes(type) || isRawType(type);
export const isVideo = (src: string | null | undefined) => !!src && /\.(mp4|webm|mov)(?:[?#]|$)/i.test(src);
export const isGif = (src: string | null | undefined) => !!src && /\.gif(?:[?#]|$)/i.test(src);
