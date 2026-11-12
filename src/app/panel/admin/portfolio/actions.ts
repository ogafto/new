"use server";

import { revalidatePath } from "next/cache";
import { all, one, run } from "@/lib/db";
import { id } from "@/lib/auth/crypto";
import { requireAdmin } from "@/lib/auth/session";
import { blobAccess, blobPublicUrl, removeLocal, saveImage, saveRaw } from "@/lib/storage";
import { isRawType } from "@/lib/media";
import { setting } from "@/lib/settings";
import { uniqueSlug } from "@/lib/projects";
import { log } from "@/lib/logs";

/* Portfolio w panelu: kategorie i prace. Każda zmiana od razu odświeża stronę główną i podstrony kategorii. */

export type CategoryState = { error?: string; ok?: boolean; id?: string; cover?: string } | undefined;
export type WorkState = { error?: string; ok?: boolean; id?: string; gallery?: string[]; image?: string } | undefined;

const str = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);
const file = (f: FormData, k: string) => {
  const v = f.get(k);
  return v instanceof File && v.size > 0 ? v : null;
};

async function refresh() {
  revalidatePath("/", "layout");
}

const dim = (f: FormData, k: string) => {
  const n = Math.round(Number(f.get(k)));
  return n > 0 && n < 20000 ? n : null;
};

/*
 * Główny plik pracy z formularza:
 *  - „image”: zdjęcie (zmniejszane do 1920 × 1080, WebP) albo mały GIF / wideo (bez przeróbek),
 *  - „media”: GIF / wideo wgrane już z przeglądarki prosto do Vercel Blob (duże pliki na Vercelu).
 * Wymiary GIF-ów i wideo odczytuje przeglądarka (pola „w” i „h”).
 */
async function storeMain(form: FormData): Promise<{ url: string; w: number | null; h: number | null } | null> {
  const f = file(form, "image");
  if (f) {
    if (isRawType(f.type)) return { url: await saveRaw(f, "portfolio"), w: dim(form, "w"), h: dim(form, "h") };
    const s = await saveImage(f, "portfolio");
    return { url: s.url, w: s.width ?? null, h: s.height ?? null };
  }
  const m = String(form.get("media") ?? "");
  if (!m) return null;
  const up = JSON.parse(m) as { url?: string; pathname?: string };
  const token = await setting("blob_token");
  if (!token || !up.url || !up.pathname?.startsWith("portfolio/") || !/\.blob\.vercel-storage\.com$/.test(new URL(up.url).hostname)) throw new Error("Nieprawidłowy plik.");
  return { url: blobPublicUrl(await blobAccess(token), { url: up.url, pathname: up.pathname }), w: dim(form, "w"), h: dim(form, "h") };
}

// nowa kategoria: najmniejszy sort − 1 → ląduje na początku strony
async function first() {
  const r = await one<{ m: number }>("SELECT COALESCE(MIN(sort), 0) m FROM categories");
  return Number(r?.m ?? 0) - 1;
}

// nowa praca: największy sort w kategorii + 1 → dochodzi na dół kategorii
async function last(categoryId: string) {
  const r = await one<{ m: number }>("SELECT COALESCE(MAX(sort), -1) m FROM projects WHERE category_id = ?", [categoryId]);
  return Number(r?.m ?? -1) + 1;
}

/* ---------- kategorie ---------- */

export async function saveCategory(_: CategoryState, form: FormData): Promise<CategoryState> {
  await requireAdmin();
  const cid = str(form, "id", 40);
  const name = str(form, "name", 60);
  const description = str(form, "description", 400);
  const published = form.get("published") === "0" ? 0 : 1; // formularz wysyła „1”/„0”; okno nowej kategorii nic → widoczna
  if (name.length < 2) return { error: "Podaj nazwę kategorii." };

  const prev = cid ? await one<{ slug: string; cover: string }>("SELECT slug, cover FROM categories WHERE id = ?", [cid]) : null;
  if (cid && !prev) return { error: "Kategoria nie istnieje." };
  const slug = await uniqueSlug("categories", str(form, "slug", 60) || name, cid);

  try {
    let cover = prev?.cover ?? "";
    const up = file(form, "cover");
    if (up) cover = (await saveImage(up, "portfolio")).url;
    if (form.get("removeCover") === "1") cover = "";
    if (prev?.cover && prev.cover !== cover) await removeLocal(prev.cover);

    const now = Date.now();
    if (prev) {
      await run("UPDATE categories SET slug = ?, name = ?, description = ?, cover = ?, published = ?, updated_at = ? WHERE id = ?", [slug, name, description, cover, published, now, cid]);
      await refresh();
      return { ok: true, id: cid, cover };
    }
    const nid = id();
    await run("INSERT INTO categories (id, slug, name, description, cover, published, sort, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
      nid,
      slug,
      name,
      description,
      cover,
      published,
      await first(),
      now,
      now,
    ]);
    await log("content", `Nowa kategoria w portfolio: ${name}`);
    await refresh();
    return { ok: true, id: nid, cover };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Nie udało się zapisać." };
  }
}

export async function toggleCategory(cid: string) {
  await requireAdmin();
  await run("UPDATE categories SET published = 1 - published, updated_at = ? WHERE id = ?", [Date.now(), cid]);
  await refresh();
}

export async function reorderCategories(ids: string[]) {
  await requireAdmin();
  const known = new Set((await all<{ id: string }>("SELECT id FROM categories")).map((r) => r.id));
  for (const [i, cid] of ids.entries()) if (known.has(cid)) await run("UPDATE categories SET sort = ? WHERE id = ?", [i, cid]);
  await refresh();
}

/** Usuwa kategorię razem z jej pracami i zdjęciami */
export async function deleteCategory(cid: string) {
  const admin = await requireAdmin();
  const c = await one<{ name: string; cover: string }>("SELECT name, cover FROM categories WHERE id = ?", [cid]);
  if (!c) return;
  const works = await all<{ image: string; gallery: string }>("SELECT image, gallery FROM projects WHERE category_id = ?", [cid]);
  await run("DELETE FROM projects WHERE category_id = ?", [cid]);
  await run("DELETE FROM categories WHERE id = ?", [cid]);
  await removeLocal(c.cover);
  for (const w of works) {
    await removeLocal(w.image);
    for (const g of JSON.parse(w.gallery || "[]") as string[]) await removeLocal(g);
  }
  await log("content", `Usunięto kategorię: ${c.name} (${works.length} prac)`, { level: "warn", actor: admin.email });
  await refresh();
}

/* ---------- prace ---------- */

async function categoryExists(cid: string) {
  return !!cid && !!(await one("SELECT 1 FROM categories WHERE id = ?", [cid]));
}

export async function saveWork(_: WorkState, form: FormData): Promise<WorkState> {
  await requireAdmin();
  const wid = str(form, "id", 40);
  const name = str(form, "name", 80);
  const categoryId = str(form, "category", 40);
  const year = str(form, "year", 4);
  const client = str(form, "client", 80);
  const description = str(form, "description", 1200);
  const url = str(form, "url", 300) || null;
  const published = form.get("published") ? 1 : 0;

  if (name.length < 2) return { error: "Podaj nazwę pracy." };
  if (!(await categoryExists(categoryId))) return { error: "Wybierz kategorię." };
  if (url && !/^https?:\/\//i.test(url)) return { error: "Link musi zaczynać się od https://" };

  const prev = wid ? await one<{ image: string; gallery: string; w: number | null; h: number | null; category_id: string | null }>("SELECT image, gallery, w, h, category_id FROM projects WHERE id = ?", [wid]) : null;
  if (wid && !prev) return { error: "Praca nie istnieje." };
  const slug = await uniqueSlug("projects", str(form, "slug", 60) || name, wid);

  try {
    let image = prev?.image ?? "";
    let size = { w: prev?.w ?? null, h: prev?.h ?? null };
    const main = await storeMain(form);
    if (main) {
      if (prev?.image && prev.image !== main.url) await removeLocal(prev.image);
      image = main.url;
      size = { w: main.w, h: main.h };
    }
    if (!image) return { error: "Dodaj zdjęcie, GIF albo wideo." };

    // galeria: zostawione + nowe
    const keep = JSON.parse(String(form.get("galleryKeep") || "[]")) as string[];
    const before = prev ? (JSON.parse(prev.gallery || "[]") as string[]) : [];
    for (const g of before) if (!keep.includes(g)) await removeLocal(g);
    const added: string[] = [];
    for (const f of form.getAll("gallery")) if (f instanceof File && f.size > 0) added.push((await saveImage(f, "portfolio")).url);
    const gallery = [...keep.filter((g) => before.includes(g)), ...added].slice(0, 30);

    const now = Date.now();
    if (prev) {
      await run(
        "UPDATE projects SET slug = ?, name = ?, category_id = ?, year = ?, client = ?, description = ?, image = ?, w = ?, h = ?, gallery = ?, url = ?, published = ?, updated_at = ? WHERE id = ?",
        [slug, name, categoryId, year, client, description, image, size.w, size.h, JSON.stringify(gallery), url, published, now, wid],
      );
      if (prev.category_id !== categoryId) await run("UPDATE projects SET sort = ? WHERE id = ?", [await last(categoryId), wid]);
      await refresh();
      return { ok: true, id: wid, gallery, image };
    }
    const nid = id();
    await run(
      `INSERT INTO projects (id, slug, name, category, category_id, year, client, description, scope, palette, image, w, h, gallery, url, featured, published, sort, created_at, updated_at)
       VALUES (?, ?, ?, 'work', ?, ?, ?, ?, '[]', '[]', ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
      [nid, slug, name, categoryId, year, client, description, image, size.w, size.h, JSON.stringify(gallery), url, published, await last(categoryId), now, now],
    );
    await log("content", `Dodano pracę do portfolio: ${name}`);
    await refresh();
    return { ok: true, id: nid, gallery, image };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Nie udało się zapisać." };
  }
}

/** Szybkie dodawanie: jeden plik (zdjęcie, GIF, wideo) = jedna praca (nazwa z pliku, do poprawienia później) */
export async function quickWork(form: FormData): Promise<{ error?: string; id?: string }> {
  await requireAdmin();
  const categoryId = str(form, "category", 40);
  if (!(await categoryExists(categoryId))) return { error: "Kategoria nie istnieje." };
  const raw = str(form, "name", 120).replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const name = (raw ? raw[0].toUpperCase() + raw.slice(1) : "Nowa praca").slice(0, 80);
  try {
    const s = await storeMain(form);
    if (!s) return { error: "Brak pliku." };
    const nid = id();
    const now = Date.now();
    await run(
      `INSERT INTO projects (id, slug, name, category, category_id, year, client, description, scope, palette, image, w, h, gallery, url, featured, published, sort, created_at, updated_at)
       VALUES (?, ?, ?, 'work', ?, ?, '', '', '[]', '[]', ?, ?, ?, '[]', NULL, 1, 1, ?, ?, ?)`,
      [nid, await uniqueSlug("projects", name), name, categoryId, String(new Date().getFullYear()), s.url, s.w, s.h, await last(categoryId), now, now],
    );
    await refresh();
    return { id: nid };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Nie udało się wgrać." };
  }
}

/** Podmienia sam plik pracy (np. GIF zamieniony w przeglądarce na wideo) — reszta pracy zostaje */
export async function swapMedia(wid: string, form: FormData): Promise<{ error?: string; image?: string }> {
  await requireAdmin();
  const prev = await one<{ image: string; name: string }>("SELECT image, name FROM projects WHERE id = ?", [wid]);
  if (!prev) return { error: "Praca nie istnieje." };
  try {
    const s = await storeMain(form);
    if (!s) return { error: "Brak pliku." };
    await run("UPDATE projects SET image = ?, w = ?, h = ?, updated_at = ? WHERE id = ?", [s.url, s.w, s.h, Date.now(), wid]);
    if (prev.image !== s.url) await removeLocal(prev.image);
    await log("content", `GIF zamieniony na wideo: ${prev.name}`);
    await refresh();
    return { image: s.url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Nie udało się zapisać." };
  }
}

export async function toggleWork(wid: string) {
  await requireAdmin();
  await run("UPDATE projects SET published = 1 - published, updated_at = ? WHERE id = ?", [Date.now(), wid]);
  await refresh();
}

export async function reorderWorks(ids: string[]) {
  await requireAdmin();
  const known = new Set((await all<{ id: string }>("SELECT id FROM projects")).map((r) => r.id));
  for (const [i, wid] of ids.entries()) if (known.has(wid)) await run("UPDATE projects SET sort = ? WHERE id = ?", [i, wid]);
  await refresh();
}

export async function moveWork(wid: string, categoryId: string) {
  await requireAdmin();
  if (!(await categoryExists(categoryId))) return;
  await run("UPDATE projects SET category_id = ?, sort = ?, updated_at = ? WHERE id = ?", [categoryId, await last(categoryId), Date.now(), wid]);
  await refresh();
}

export async function deleteWork(wid: string) {
  const admin = await requireAdmin();
  const p = await one<{ name: string; image: string; gallery: string }>("SELECT name, image, gallery FROM projects WHERE id = ?", [wid]);
  if (!p) return;
  await run("DELETE FROM projects WHERE id = ?", [wid]);
  await removeLocal(p.image);
  for (const g of JSON.parse(p.gallery || "[]") as string[]) await removeLocal(g);
  await log("content", `Usunięto pracę z portfolio: ${p.name}`, { level: "warn", actor: admin.email });
  await refresh();
}
