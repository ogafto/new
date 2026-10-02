import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { id } from "./auth/crypto";
import { setting } from "./settings";

/*
 * Zapis wgranych plików.
 * - domyślnie na dysk serwera: data/uploads/RRRR/MM/… (serwowane pod /media/…)
 * - jeśli podasz token Vercel Blob (Panel → Ustawienia → Pliki albo BLOB_READ_WRITE_TOKEN) — do chmury (na Vercelu dysk nie jest trwały)
 * Zdjęcia są zmniejszane do max 2400 px i zapisywane jako WebP.
 */

export const UPLOAD_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || "data/uploads");
const MAX = 15 * 1024 * 1024;
const IMAGE = /^image\/(jpeg|png|webp|avif|gif)$/;

export async function saveImage(file: File, folder = "") {
  if (!(file instanceof File) || file.size === 0) throw new Error("Brak pliku.");
  if (file.size > MAX) throw new Error("Plik jest za duży (max 15 MB).");
  if (!IMAGE.test(file.type)) throw new Error("Dozwolone są zdjęcia JPG, PNG, WebP, AVIF lub GIF.");

  const input = Buffer.from(await file.arrayBuffer());
  const img = sharp(input, { animated: file.type === "image/gif" }).rotate();
  const meta = await img.metadata();
  const out = await img.resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();

  const d = new Date();
  const rel = [folder, String(d.getFullYear()), String(d.getMonth() + 1).padStart(2, "0"), `${id()}.webp`].filter(Boolean).join("/");

  const token = await setting("blob_token");
  if (token) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`uploads/${rel}`, out, { access: "public", contentType: "image/webp", token });
    return { url: blob.url, width: meta.width, height: meta.height };
  }

  if (process.env.VERCEL) throw new Error("Na Vercelu zdjęcia wymagają Vercel Blob — wklej token w Panel → Ustawienia → Pliki.");
  const target = path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, rel);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, out);
  return { url: `/media/${rel}`, width: meta.width, height: meta.height };
}

// Usuwa plik wgrany lokalnie (adresy /media/…); pliki z chmury i z /public zostają
export async function removeLocal(url: string | null | undefined) {
  if (!url?.startsWith("/media/")) return;
  const { unlink } = await import("node:fs/promises");
  const file = path.resolve(/*turbopackIgnore: true*/ UPLOAD_DIR, url.slice("/media/".length));
  if (file.startsWith(UPLOAD_DIR + path.sep)) await unlink(file).catch(() => {});
}
