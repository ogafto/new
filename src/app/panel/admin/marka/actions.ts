"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { addBrandAsset, categoryFor, kindOf, KINDS, MAX_BYTES, type BrandAsset } from "@/lib/brand";
import { one, run } from "@/lib/db";
import { id } from "@/lib/auth/crypto";
import { log } from "@/lib/logs";
import { setting } from "@/lib/settings";
import { blobAccess, blobDelete, blobPublicUrl, removeLocal, saveRawLocal } from "@/lib/storage";

type R = { ok?: string; error?: string };
const done = () => revalidatePath("/panel/admin/marka");

/** Rejestracja pliku wgranego bezpośrednio do Vercel Blob (magazyn publiczny albo prywatny) */
export async function registerBrandAsset(a: { name: string; url: string; pathname: string; bytes: number }): Promise<R> {
  const admin = await requireAdmin();
  const kind = kindOf(a.name);
  if (!(KINDS as readonly string[]).includes(kind)) return { error: "Nieobsługiwany format." };
  if (!/^https:\/\/[a-z0-9-]+\.(public|private)\.blob\.vercel-storage\.com\//.test(a.url)) return { error: "Nieprawidłowy adres pliku." };
  const token = await setting("blob_token");
  if (!token) return { error: "Brak tokenu Vercel Blob." };
  const url = blobPublicUrl(await blobAccess(token), a);
  await addBrandAsset({ category: categoryFor(kind), name: a.name.replace(/\.[^.]+$/, ""), url, kind, bytes: a.bytes });
  await log("content", `Dodano do marki: ${a.name}`, { actor: admin.email });
  done();
  return { ok: "Dodano." };
}

/** Wgrywanie na dysk serwera (lokalnie / własny serwer) */
export async function uploadBrandLocal(form: FormData): Promise<R> {
  const admin = await requireAdmin();
  const files = form.getAll("file").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "Wybierz plik." };
  for (const f of files) {
    const kind = kindOf(f.name);
    if (!(KINDS as readonly string[]).includes(kind)) return { error: `${f.name}: nieobsługiwany format (MP4, WebM, GIF, PNG, JPG, WebP, SVG, PDF).` };
    if (f.size > MAX_BYTES) return { error: `${f.name}: plik jest za duży (max 200 MB).` };
    try {
      const url = await saveRawLocal(f, "brand", kind === "jpeg" ? "jpg" : kind);
      await addBrandAsset({ category: categoryFor(kind), name: f.name.replace(/\.[^.]+$/, ""), url, kind, bytes: f.size });
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Nie udało się zapisać pliku." };
    }
  }
  await log("content", `Dodano do marki: ${files.map((f) => f.name).join(", ")}`, { actor: admin.email });
  done();
  return { ok: files.length > 1 ? `Dodano ${files.length} pliki.` : "Dodano." };
}

export async function renameBrandAsset(aid: string, name: string): Promise<R> {
  await requireAdmin();
  const n = name.trim().slice(0, 160);
  if (!n) return { error: "Podaj nazwę." };
  await run("UPDATE brand_assets SET name = ? WHERE id = ?", [n, aid]);
  done();
  return { ok: "Zapisano." };
}

export async function deleteBrandAsset(aid: string): Promise<R> {
  const admin = await requireAdmin();
  const a = await one<BrandAsset>("SELECT * FROM brand_assets WHERE id = ?", [aid]);
  if (!a) return {};
  await run("DELETE FROM brand_assets WHERE id = ?", [aid]);
  if (a.url.startsWith("/media/") && !a.url.startsWith("/media/b/")) await removeLocal(a.url);
  else {
    const token = await setting("blob_token");
    if (token) await blobDelete(a.url, token);
  }
  await log("content", `Usunięto z marki: ${a.name}`, { level: "warn", actor: admin.email });
  done();
  return { ok: "Usunięto." };
}

export async function addBrandColor(c: { name: string; hex: string; note: string }): Promise<R> {
  await requireAdmin();
  const hex = c.hex.trim().toUpperCase().replace(/^([^#])/, "#$1");
  if (!/^#[0-9A-F]{6}$/.test(hex)) return { error: "Kolor w formacie HEX, np. #8B6CFF." };
  if (!c.name.trim()) return { error: "Podaj nazwę koloru." };
  await run("INSERT INTO brand_colors (id, name, hex, note, created_at) VALUES (?, ?, ?, ?, ?)", [id(), c.name.trim().slice(0, 60), hex, c.note.trim().slice(0, 120) || null, Date.now()]);
  done();
  return { ok: "Dodano kolor." };
}

export async function deleteBrandColor(cid: string): Promise<R> {
  await requireAdmin();
  await run("DELETE FROM brand_colors WHERE id = ?", [cid]);
  done();
  return { ok: "Usunięto." };
}
