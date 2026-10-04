import { timingSafeEqual } from "node:crypto";
import { all, one, run } from "./db";
import { baseUrl } from "./mail";

/*
 * CMS dla stron klientów.
 * Strona (site) → sekcje (collections: pojedyncze albo listy) → pola (fields).
 * Klient edytuje treści w swoim panelu, a jego strona pobiera je z publicznego API:
 *   GET /api/cms/{public_key}            — wszystkie treści
 *   GET /api/cms/{public_key}/{sekcja}   — jedna sekcja
 *   + nagłówek „Authorization: Bearer sk_…” (tylko z serwera strony) — również pola typu „sekret”
 *   PUT /api/cms/{public_key}/schema     — strona sama zgłasza swoje sekcje i pola (Bearer sk_…)
 */

import type { Collection, Entry, Field, Site } from "./cms-schema";
export * from "./cms-schema";

const json = <T,>(v: string, fallback: T): T => {
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
};

type CollectionRow = Omit<Collection, "fields"> & { fields: string };
type EntryRow = Omit<Entry, "data"> & { data: string };
const toCollection = (r: CollectionRow): Collection => ({ ...r, fields: json<Field[]>(r.fields, []) });
const toEntry = (r: EntryRow): Entry => ({ ...r, data: json<Record<string, unknown>>(r.data, {}) });

export const getSite = (id: string) => one<Site>("SELECT * FROM cms_sites WHERE id = ?", [id]);
export const listSites = () =>
  all<Site & { owner_name: string | null; owner_email: string | null; entries: number }>(
    `SELECT s.*, u.name owner_name, u.email owner_email,
       (SELECT COUNT(*) FROM cms_entries e JOIN cms_collections c ON c.id = e.collection_id WHERE c.site_id = s.id) entries
     FROM cms_sites s LEFT JOIN users u ON u.id = s.owner_id ORDER BY s.updated_at DESC`,
  );
export const sitesForUser = (userId: string) => all<Site>("SELECT * FROM cms_sites WHERE owner_id = ? ORDER BY name", [userId]);

export async function getCollections(siteId: string) {
  return (await all<CollectionRow>("SELECT * FROM cms_collections WHERE site_id = ? ORDER BY sort, name", [siteId])).map(toCollection);
}
export async function getCollection(id: string) {
  const r = await one<CollectionRow>("SELECT * FROM cms_collections WHERE id = ?", [id]);
  return r ? toCollection(r) : null;
}
export async function getEntries(collectionId: string) {
  return (await all<EntryRow>("SELECT * FROM cms_entries WHERE collection_id = ? ORDER BY sort, updated_at", [collectionId])).map(toEntry);
}

// Treści do publicznego API — obrazki z adresami bezwzględnymi
export async function publicContent(publicKey: string, only?: string, opts: { secret?: string | null; from?: string | null } = {}) {
  const site = await one<Site>("SELECT * FROM cms_sites WHERE public_key = ?", [publicKey]);
  if (!site) return null;
  // pola „sekret” tylko dla serwera strony (nagłówek Authorization: Bearer sk_…), nigdy publicznie
  const full = !!opts.secret && !!site.secret_key && safeEq(opts.secret, site.secret_key);
  // „połączona”: kiedy i skąd strona ostatnio pobrała treści (zapis najwyżej raz na minutę)
  if (Date.now() - Number(site.last_seen ?? 0) > 60_000) run("UPDATE cms_sites SET last_seen = ?, last_origin = ? WHERE id = ?", [Date.now(), opts.from?.slice(0, 200) ?? null, site.id]).catch(() => {});
  const cols = (await getCollections(site.id)).filter((c) => !only || c.key === only);
  if (only && !cols.length) return null;
  const base = await baseUrl();
  const abs = (v: unknown) => (typeof v === "string" && v.startsWith("/media/") ? `${base}${v}` : v);
  const content: Record<string, unknown> = {};
  for (const c of cols) {
    const entries = await getEntries(c.id);
    const shape = (e: Entry) => Object.fromEntries(c.fields.filter((f) => full || f.type !== "secret").map((f) => [f.key, f.type === "image" ? abs(e.data[f.key]) : (e.data[f.key] ?? null)]));
    content[c.key] = c.kind === "single" ? (entries[0] ? shape(entries[0]) : null) : entries.map((e) => ({ id: e.id, ...shape(e) }));
  }
  return { site: { name: site.name, domain: site.domain }, updatedAt: new Date(Number(site.updated_at)).toISOString(), private: full, content: only ? content[only] : content };
}

function safeEq(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const siteByKey = (publicKey: string) => one<Site>("SELECT * FROM cms_sites WHERE public_key = ?", [publicKey]);
export const secretOk = (site: Pick<Site, "secret_key">, header: string | null) => {
  const t = header?.match(/^Bearer\s+(\S+)$/i)?.[1];
  return !!t && !!site.secret_key && safeEq(t, site.secret_key);
};

// klucz podany przez stronę / AI: zostaje 1:1 (np. heroTitle) — tylko bez znaków spoza [A-Za-z0-9_]
export const apiKey = (v: string) =>
  String(v ?? "")
    .trim()
    .replace(/[^A-Za-z0-9_]+/g, "_")
    .replace(/^[^A-Za-z]+/, "")
    .replace(/_+$/, "")
    .slice(0, 40);

// dopasowanie kluczy treści do pól mimo innej pisowni (heroTitle / hero_title / herotitle)
const loose = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, "");
export function alignKeys(fields: Field[], data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const src = data as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const hit = f.key in src ? f.key : Object.keys(src).find((k) => loose(k) === loose(f.key));
    if (hit !== undefined) out[f.key] = src[hit];
  }
  return out;
}

export function slugKey(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
}
