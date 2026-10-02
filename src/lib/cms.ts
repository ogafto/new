import { all, one } from "./db";
import { baseUrl } from "./mail";

/*
 * CMS dla stron klientów.
 * Strona (site) → sekcje (collections: pojedyncze albo listy) → pola (fields).
 * Klient edytuje treści w swoim panelu, a jego strona pobiera je z publicznego API:
 *   GET /api/cms/{public_key}            — wszystkie treści
 *   GET /api/cms/{public_key}/{sekcja}   — jedna sekcja
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
export async function publicContent(publicKey: string, only?: string) {
  const site = await one<Site>("SELECT * FROM cms_sites WHERE public_key = ?", [publicKey]);
  if (!site) return null;
  const cols = (await getCollections(site.id)).filter((c) => !only || c.key === only);
  if (only && !cols.length) return null;
  const base = await baseUrl();
  const abs = (v: unknown) => (typeof v === "string" && v.startsWith("/media/") ? `${base}${v}` : v);
  const content: Record<string, unknown> = {};
  for (const c of cols) {
    const entries = await getEntries(c.id);
    const shape = (e: Entry) => Object.fromEntries(c.fields.map((f) => [f.key, f.type === "image" ? abs(e.data[f.key]) : (e.data[f.key] ?? null)]));
    content[c.key] = c.kind === "single" ? (entries[0] ? shape(entries[0]) : null) : entries.map((e) => ({ id: e.id, ...shape(e) }));
  }
  return { site: { name: site.name, domain: site.domain }, updatedAt: new Date(site.updated_at).toISOString(), content: only ? content[only] : content };
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
