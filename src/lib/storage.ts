import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { id } from "./auth/crypto";
import { setting } from "./settings";
import { one, run } from "./db";
import { MAX_RAW_BYTES, RAW_TYPES } from "./media";

/*
 * Zapis wgranych plików.
 * - domyślnie na dysk serwera: data/uploads/RRRR/MM/… (serwowane pod /media/…)
 * - jeśli podasz token Vercel Blob (Panel → Ustawienia → Pliki albo BLOB_READ_WRITE_TOKEN) — do chmury (na Vercelu dysk nie jest trwały)
 * Zdjęcia portfolio mieszczą się w 1920 × 1080 (szerokość do 1920, wysokość do 1080; większe są
 * proporcjonalnie zmniejszane, mniejsze zostają bez powiększania) i są zapisywane jako WebP.
 */

export const MAX_IMAGE = { width: 1920, height: 1080 };

export const UPLOAD_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || "data/uploads");
const MAX = 15 * 1024 * 1024;
const IMAGE = /^image\/(jpeg|png|webp|avif|gif)$/;

export async function saveImage(file: File, folder = "", fit = MAX_IMAGE) {
  if (!(file instanceof File) || file.size === 0) throw new Error("Brak pliku.");
  if (file.size > MAX) throw new Error("Plik jest za duży (max 15 MB).");
  if (!IMAGE.test(file.type)) throw new Error("Dozwolone są zdjęcia JPG, PNG, WebP, AVIF lub GIF.");

  const input = Buffer.from(await file.arrayBuffer());
  const img = sharp(input, { animated: file.type === "image/gif" }).rotate();
  const { data: out, info } = await img.resize({ width: fit.width, height: fit.height, fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer({ resolveWithObject: true });

  // animowany GIF: info.height to wszystkie klatki naraz, wysokość jednej klatki to pageHeight
  const meta = { width: info.width, height: (info as { pageHeight?: number }).pageHeight ?? info.height };

  const d = new Date();
  const rel = [folder, String(d.getFullYear()), String(d.getMonth() + 1).padStart(2, "0"), `${id()}.webp`].filter(Boolean).join("/");

  const token = await setting("blob_token");
  if (token) {
    const url = await blobPut(`uploads/${rel}`, out, "image/webp", token);
    return { url, width: meta.width, height: meta.height };
  }

  if (process.env.VERCEL) throw new Error("Na Vercelu zdjęcia wymagają Vercel Blob — wklej token w Panel → Ustawienia → Pliki.");
  const target = path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, rel);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, out);
  return { url: `/media/${rel}`, width: meta.width, height: meta.height };
}

// GIF / wideo bez przetwarzania: do Vercel Blob (gdy jest token) albo na dysk serwera.
// Na Vercelu duże pliki idą prosto z przeglądarki do Blob (/api/portfolio/upload) — tu trafiają tylko małe.
export async function saveRaw(file: File, folder: string) {
  const ext = RAW_TYPES[file.type];
  if (!ext) throw new Error("Dozwolone są zdjęcia, GIF-y i wideo MP4 / WebM.");
  if (file.size > MAX_RAW_BYTES) throw new Error("Plik jest za duży (max 300 MB).");
  const token = await setting("blob_token");
  if (!token) return saveRawLocal(file, folder, ext);
  const d = new Date();
  return blobPut(`uploads/${folder}/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${id()}.${ext}`, Buffer.from(await file.arrayBuffer()), file.type, token);
}

// Zapis pliku bez przetwarzania — na dysk serwera (lokalnie / własny serwer).
export async function saveRawLocal(file: File, folder: string, ext: string) {
  if (process.env.VERCEL) throw new Error("Na Vercelu wgrywanie wymaga Vercel Blob — wklej token w Panel → Ustawienia → Pliki.");
  const d = new Date();
  const rel = [folder, String(d.getFullYear()), String(d.getMonth() + 1).padStart(2, "0"), `${id()}.${ext}`].join("/");
  const target = path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, rel);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await file.arrayBuffer()));
  return `/media/${rel}`;
}

// Usuwa plik wgrany lokalnie (adresy /media/…); pliki z chmury i z /public zostają
export async function removeLocal(url: string | null | undefined) {
  if (!url?.startsWith("/media/") || url.startsWith("/media/b/")) return;
  const { unlink } = await import("node:fs/promises");
  const file = path.resolve(/*turbopackIgnore: true*/ UPLOAD_DIR, url.slice("/media/".length));
  if (file.startsWith(UPLOAD_DIR + path.sep)) await unlink(file).catch(() => {});
}

/* ---------- Vercel Blob: magazyn publiczny albo prywatny ---------- */

/*
 * Magazyn Blob może być publiczny (pliki pod adresem *.public.blob.vercel-storage.com)
 * albo prywatny (dostęp tylko z tokenem). Prywatne pliki serwujemy przez /media/b/<ścieżka>.
 * Typ magazynu wykrywa się sam przy pierwszym zapisie i jest zapamiętywany w bazie.
 */
export type BlobAccess = "public" | "private";
const g = globalThis as unknown as { __afto_blob_access?: { token: string; access: BlobAccess } };

export async function blobAccess(token: string): Promise<BlobAccess> {
  const c = g.__afto_blob_access;
  if (c?.token === token) return c.access;
  const key = `blob_access:${token.slice(-10)}`;
  const saved = await one<{ value: string }>("SELECT value FROM meta WHERE key = ?", [key]).catch(() => null);
  let access = saved?.value as BlobAccess | undefined;
  if (access !== "public" && access !== "private") {
    const { put, del } = await import("@vercel/blob");
    try {
      const r = await put(`.afto-probe-${Date.now()}.txt`, "ok", { access: "public", token, addRandomSuffix: true });
      access = "public";
      await del(r.url, { token }).catch(() => {});
    } catch (e) {
      if (!/private/i.test(String(e))) throw e;
      access = "private";
    }
    await run("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [key, access]).catch(() => {});
  }
  g.__afto_blob_access = { token, access };
  return access;
}

/** Tryb Vercel Blob dla wgrywania z przeglądarki (null = brak Blob, pliki idą przez serwer) */
export async function blobMode(): Promise<BlobAccess | null> {
  const token = await setting("blob_token");
  return token ? blobAccess(token).catch(() => null) : null;
}

/** Adres pliku do zapisania w bazie: publiczny URL albo /media/b/<ścieżka> dla prywatnego magazynu */
export const blobPublicUrl = (access: BlobAccess, r: { url: string; pathname: string }) => (access === "public" ? r.url : `/media/b/${r.pathname}`);

export async function blobPut(pathname: string, body: Buffer, contentType: string, token: string) {
  const { put } = await import("@vercel/blob");
  const access = await blobAccess(token);
  const r = await put(pathname, body, { access, contentType, token, addRandomSuffix: true });
  return blobPublicUrl(access, r);
}

export async function blobDelete(url: string, token: string) {
  const { del } = await import("@vercel/blob");
  const target = url.startsWith("/media/b/") ? url.slice("/media/b/".length) : url;
  await del(target, { token }).catch(() => {});
}
