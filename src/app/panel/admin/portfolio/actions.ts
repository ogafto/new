"use server";

import { revalidatePath } from "next/cache";
import { all, one, run } from "@/lib/db";
import { id } from "@/lib/auth/crypto";
import { requireAdmin } from "@/lib/auth/session";
import { removeLocal, saveImage } from "@/lib/storage";
import { services, type ServiceId } from "@/lib/site";

export type ProjectState = { error?: string; ok?: boolean; id?: string; gallery?: string[]; image?: string } | undefined;

const slugify = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
const list = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 12);

function refresh(...slugs: (string | undefined)[]) {
  revalidatePath("/");
  revalidatePath("/portfolio");
  revalidatePath("/sitemap.xml");
  for (const s of slugs) if (s) revalidatePath(`/portfolio/${s}`);
  revalidatePath("/panel/admin/portfolio");
}

export async function saveProject(_: ProjectState, form: FormData): Promise<ProjectState> {
  await requireAdmin();
  const pid = String(form.get("id") || "");
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  const slug = slugify(String(form.get("slug") || "") || name);
  const category = String(form.get("category") ?? "www") as ServiceId;
  const year = String(form.get("year") ?? "").trim().slice(0, 4) || String(new Date().getFullYear());
  const client = String(form.get("client") ?? "").trim().slice(0, 80);
  const description = String(form.get("description") ?? "").trim().slice(0, 1200);
  const url = String(form.get("url") ?? "").trim().slice(0, 300) || null;
  const scope = list(form.get("scope"));
  const palette = list(form.get("palette")).filter((c) => /^#[0-9a-f]{3,8}$/i.test(c));
  const featured = form.get("featured") ? 1 : 0;
  const published = form.get("published") ? 1 : 0;

  if (name.length < 2) return { error: "Podaj nazwę projektu." };
  if (!slug) return { error: "Nieprawidłowy adres (slug)." };
  if (!services.some((s) => s.id === category)) return { error: "Wybierz usługę." };
  if (!client) return { error: "Podaj klienta / branżę." };
  if (description.length < 10) return { error: "Dodaj krótki opis (min. 10 znaków)." };
  if (await one("SELECT 1 FROM projects WHERE slug = ? AND id != ?", [slug, pid])) return { error: "Projekt z takim adresem już istnieje — zmień nazwę lub slug." };

  const prev = pid ? await one<{ slug: string; image: string; gallery: string }>("SELECT slug, image, gallery FROM projects WHERE id = ?", [pid]) : null;
  if (pid && !prev) return { error: "Projekt nie istnieje." };

  try {
    // zdjęcie główne
    let image = prev?.image ?? "";
    const file = form.get("image");
    if (file instanceof File && file.size > 0) {
      image = (await saveImage(file, "portfolio")).url;
      if (prev?.image && prev.image !== image) await removeLocal(prev.image);
    }
    if (!image) return { error: "Dodaj zdjęcie główne." };

    // galeria: zostawione + nowe
    const keep = JSON.parse(String(form.get("galleryKeep") || "[]")) as string[];
    const before = prev ? (JSON.parse(prev.gallery) as string[]) : [];
    for (const g of before) if (!keep.includes(g)) await removeLocal(g);
    const added: string[] = [];
    for (const f of form.getAll("gallery")) if (f instanceof File && f.size > 0) added.push((await saveImage(f, "portfolio")).url);
    const gallery = [...keep.filter((g) => before.includes(g)), ...added].slice(0, 24);

    const now = Date.now();
    if (prev) {
      await run(
        `UPDATE projects SET slug=?, name=?, category=?, year=?, client=?, description=?, scope=?, palette=?, image=?, gallery=?, url=?, featured=?, published=?, updated_at=? WHERE id=?`,
        [slug, name, category, year, client, description, JSON.stringify(scope), JSON.stringify(palette), image, JSON.stringify(gallery), url, featured, published, now, pid],
      );
      refresh(prev.slug, slug);
      return { ok: true, id: pid, gallery, image };
    }
    const nid = id();
    const min = await one<{ m: number }>("SELECT COALESCE(MIN(sort), 0) m FROM projects");
    await run(
      `INSERT INTO projects (id, slug, name, category, year, client, description, scope, palette, image, gallery, url, featured, published, sort, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nid, slug, name, category, year, client, description, JSON.stringify(scope), JSON.stringify(palette), image, JSON.stringify(gallery), url, featured, published, Number(min?.m ?? 0) - 1, now, now],
    );
    refresh(slug);
    return { ok: true, id: nid, gallery, image };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Nie udało się zapisać." };
  }
}

export async function deleteProject(pid: string) {
  await requireAdmin();
  const p = await one<{ slug: string; image: string; gallery: string }>("SELECT slug, image, gallery FROM projects WHERE id = ?", [pid]);
  if (!p) return;
  await run("DELETE FROM projects WHERE id = ?", [pid]);
  await removeLocal(p.image);
  for (const g of JSON.parse(p.gallery) as string[]) await removeLocal(g);
  refresh(p.slug);
}

export async function toggleProject(pid: string, field: "published" | "featured") {
  await requireAdmin();
  const p = await one<{ slug: string }>("SELECT slug FROM projects WHERE id = ?", [pid]);
  await run(`UPDATE projects SET ${field === "published" ? "published = 1 - published" : "featured = 1 - featured"}, updated_at = ? WHERE id = ?`, [Date.now(), pid]);
  refresh(p?.slug);
}

// nowa kolejność (lista id od góry)
export async function reorderProjects(ids: string[]) {
  await requireAdmin();
  const rows = await all<{ id: string }>("SELECT id FROM projects");
  const known = new Set(rows.map((r) => r.id));
  for (const [i, pid] of ids.entries()) if (known.has(pid)) await run("UPDATE projects SET sort = ? WHERE id = ?", [i, pid]);
  refresh();
}
