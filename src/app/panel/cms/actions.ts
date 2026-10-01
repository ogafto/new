"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { one, run } from "@/lib/db";
import { id } from "@/lib/auth/crypto";
import { isAdmin, requireAdmin, requireUser } from "@/lib/auth/session";
import { getCollection, getSite, PRESETS, slugKey, type Field, type FieldType } from "@/lib/cms";
import { saveImage } from "@/lib/storage";

export type CmsState = { error?: string; ok?: boolean; id?: string } | undefined;
const TYPES: FieldType[] = ["text", "textarea", "image", "url", "number", "toggle", "color", "date"];
const newKey = () => `pk_${randomBytes(12).toString("base64url")}`;

// klient może edytować tylko swoje strony; admin wszystkie
async function canEdit(siteId: string) {
  const user = await requireUser();
  const site = await getSite(siteId);
  if (!site || (!isAdmin(user) && site.owner_id !== user.id)) throw new Error("Brak dostępu.");
  return { user, site };
}

const touch = (siteId: string) => run("UPDATE cms_sites SET updated_at = ? WHERE id = ?", [Date.now(), siteId]);

function refresh(siteId: string) {
  revalidatePath(`/panel/admin/strony/${siteId}`);
  revalidatePath(`/panel/strona/${siteId}`);
  revalidatePath("/panel/admin/strony");
  revalidatePath("/panel");
}

// po zapisie: powiadom stronę klienta (np. Vercel Deploy Hook), żeby się przebudowała
async function ping(webhook: string | null) {
  if (!webhook) return;
  fetch(webhook, { method: "POST" }).catch(() => {});
}

/* ---------- strony (admin) ---------- */

export async function createSite(_: CmsState, form: FormData): Promise<CmsState> {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  const domain = String(form.get("domain") ?? "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "").slice(0, 120) || null;
  const owner = String(form.get("owner") ?? "") || null;
  const preset = PRESETS[String(form.get("preset") ?? "firma")] ?? PRESETS.firma;
  if (name.length < 2) return { error: "Podaj nazwę strony." };
  const sid = id();
  const now = Date.now();
  await run("INSERT INTO cms_sites (id, name, domain, owner_id, public_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [sid, name, domain, owner, newKey(), now, now]);
  for (const [i, c] of preset.collections.entries()) {
    const cid = id();
    await run("INSERT INTO cms_collections (id, site_id, key, name, kind, fields, sort) VALUES (?, ?, ?, ?, ?, ?, ?)", [cid, sid, c.key, c.name, c.kind, JSON.stringify(c.fields), i]);
    if (c.kind === "single") await run("INSERT INTO cms_entries (id, collection_id, data, sort, updated_at) VALUES (?, ?, '{}', 0, ?)", [id(), cid, now]);
  }
  revalidatePath("/panel/admin/strony");
  return { ok: true, id: sid };
}

export async function updateSite(siteId: string, form: FormData) {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  const domain = String(form.get("domain") ?? "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "").slice(0, 120) || null;
  const owner = String(form.get("owner") ?? "") || null;
  const webhook = String(form.get("webhook") ?? "").trim().slice(0, 400) || null;
  if (webhook && !/^https:\/\//.test(webhook)) return { error: "Webhook musi zaczynać się od https://" };
  if (name.length < 2) return { error: "Podaj nazwę strony." };
  await run("UPDATE cms_sites SET name = ?, domain = ?, owner_id = ?, webhook_url = ?, updated_at = ? WHERE id = ?", [name, domain, owner, webhook, Date.now(), siteId]);
  refresh(siteId);
  return { ok: true };
}

export async function regenerateKey(siteId: string) {
  await requireAdmin();
  await run("UPDATE cms_sites SET public_key = ? WHERE id = ?", [newKey(), siteId]);
  refresh(siteId);
}

export async function deleteSite(siteId: string) {
  await requireAdmin();
  await run("DELETE FROM cms_sites WHERE id = ?", [siteId]);
  revalidatePath("/panel/admin/strony");
}

/* ---------- sekcje i pola (admin) ---------- */

export async function saveCollection(siteId: string, input: { id?: string; name: string; key?: string; kind: "single" | "list"; fields: Field[] }): Promise<CmsState> {
  await requireAdmin();
  const name = input.name.trim().slice(0, 60);
  const key = slugKey(input.key || name);
  if (name.length < 2 || !key) return { error: "Podaj nazwę sekcji." };
  const seen = new Set<string>();
  const fields: Field[] = [];
  for (const f of input.fields) {
    const k = slugKey(f.key || f.label);
    if (!k || !f.label.trim() || seen.has(k) || !TYPES.includes(f.type)) return { error: `Sprawdź pole „${f.label || "bez nazwy"}” (unikalny klucz i typ).` };
    seen.add(k);
    fields.push({ key: k, label: f.label.trim().slice(0, 60), type: f.type, required: !!f.required, help: f.help?.trim().slice(0, 140) || undefined });
  }
  if (!fields.length) return { error: "Dodaj przynajmniej jedno pole." };
  if (await one("SELECT 1 FROM cms_collections WHERE site_id = ? AND key = ? AND id != ?", [siteId, key, input.id ?? ""])) return { error: "Sekcja o takim kluczu już istnieje." };

  if (input.id) {
    await run("UPDATE cms_collections SET name = ?, key = ?, kind = ?, fields = ? WHERE id = ? AND site_id = ?", [name, key, input.kind, JSON.stringify(fields), input.id, siteId]);
  } else {
    const cid = id();
    const max = await one<{ m: number }>("SELECT COALESCE(MAX(sort), -1) m FROM cms_collections WHERE site_id = ?", [siteId]);
    await run("INSERT INTO cms_collections (id, site_id, key, name, kind, fields, sort) VALUES (?, ?, ?, ?, ?, ?, ?)", [cid, siteId, key, name, input.kind, JSON.stringify(fields), Number(max?.m ?? -1) + 1]);
    if (input.kind === "single") await run("INSERT INTO cms_entries (id, collection_id, data, sort, updated_at) VALUES (?, ?, '{}', 0, ?)", [id(), cid, Date.now()]);
  }
  await touch(siteId);
  refresh(siteId);
  return { ok: true };
}

export async function deleteCollection(siteId: string, cid: string) {
  await requireAdmin();
  await run("DELETE FROM cms_collections WHERE id = ? AND site_id = ?", [cid, siteId]);
  await touch(siteId);
  refresh(siteId);
}

/* ---------- treści (klient i admin) ---------- */

export async function saveEntry(collectionId: string, entryId: string | null, data: Record<string, unknown>): Promise<CmsState> {
  const col = await getCollection(collectionId);
  if (!col) return { error: "Sekcja nie istnieje." };
  let ctx;
  try {
    ctx = await canEdit(col.site_id);
  } catch {
    return { error: "Brak dostępu." };
  }
  const clean: Record<string, unknown> = {};
  for (const f of col.fields) {
    const v = data[f.key];
    if (f.type === "toggle") clean[f.key] = !!v;
    else if (f.type === "number") clean[f.key] = v === "" || v === null || v === undefined ? null : Number(v);
    else clean[f.key] = typeof v === "string" ? v.slice(0, f.type === "textarea" ? 20000 : 2000) : null;
    if (f.required && (clean[f.key] === null || clean[f.key] === "")) return { error: `Pole „${f.label}” jest wymagane.` };
  }
  const now = Date.now();
  if (entryId) {
    await run("UPDATE cms_entries SET data = ?, updated_at = ?, updated_by = ? WHERE id = ? AND collection_id = ?", [JSON.stringify(clean), now, ctx.user.name, entryId, collectionId]);
  } else {
    const max = await one<{ m: number }>("SELECT COALESCE(MAX(sort), -1) m FROM cms_entries WHERE collection_id = ?", [collectionId]);
    entryId = id();
    await run("INSERT INTO cms_entries (id, collection_id, data, sort, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?)", [entryId, collectionId, JSON.stringify(clean), Number(max?.m ?? -1) + 1, now, ctx.user.name]);
  }
  await touch(col.site_id);
  ping(ctx.site.webhook_url);
  refresh(col.site_id);
  return { ok: true, id: entryId };
}

export async function deleteEntry(collectionId: string, entryId: string) {
  const col = await getCollection(collectionId);
  if (!col) return;
  const { site } = await canEdit(col.site_id);
  await run("DELETE FROM cms_entries WHERE id = ? AND collection_id = ?", [entryId, collectionId]);
  await touch(col.site_id);
  ping(site.webhook_url);
  refresh(col.site_id);
}

export async function moveEntry(collectionId: string, ids: string[]) {
  const col = await getCollection(collectionId);
  if (!col) return;
  const { site } = await canEdit(col.site_id);
  for (const [i, eid] of ids.entries()) await run("UPDATE cms_entries SET sort = ? WHERE id = ? AND collection_id = ?", [i, eid, collectionId]);
  await touch(col.site_id);
  ping(site.webhook_url);
  refresh(col.site_id);
}

export async function uploadCmsImage(siteId: string, form: FormData): Promise<{ url?: string; error?: string }> {
  try {
    await canEdit(siteId);
    const file = form.get("file");
    if (!(file instanceof File)) return { error: "Brak pliku." };
    return { url: (await saveImage(file, `cms/${siteId}`)).url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Nie udało się wgrać zdjęcia." };
  }
}
