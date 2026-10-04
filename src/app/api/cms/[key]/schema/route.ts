import { revalidatePath } from "next/cache";
import { id } from "@/lib/auth/crypto";
import { all, run } from "@/lib/db";
import { cleanEntry, FIELD_TYPES, secretOk, siteByKey, slugKey, type Field, type FieldType } from "@/lib/cms";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

const TYPES = FIELD_TYPES.map((t) => t.type) as FieldType[];
type In = { key: string; name: string; kind?: "single" | "list"; item?: string; hint?: string; fields: { key: string; label: string; type: string; required?: boolean; help?: string }[]; defaults?: Record<string, unknown> | Record<string, unknown>[] };

// Aktualny schemat (sekcje i pola) — z kluczem sekretnym
export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const site = await siteByKey((await params).key);
  if (!site || !secretOk(site, req.headers.get("authorization"))) return Response.json({ error: "Brak dostępu" }, { status: 401, headers: cors });
  const cols = await all<{ key: string; name: string; kind: string; fields: string; item: string | null; hint: string | null }>("SELECT key, name, kind, item, hint, fields FROM cms_collections WHERE site_id = ? ORDER BY sort", [site.id]);
  return Response.json({ collections: cols.map((c) => ({ ...c, fields: JSON.parse(c.fields) })) }, { headers: { ...cors, "Cache-Control": "no-store" } });
}

/*
 * Strona klienta zgłasza, co ma być edytowalne:
 *   { webhook?: "https://…/api/revalidate?token=…",
 *     collections: [{ key, name, kind, item?, hint?, fields: [{ key, label, type, required?, help? }], defaults? }] }
 * - sekcje są dopisywane albo aktualizowane (po kluczu) — nic nie jest usuwane,
 * - defaults = obecna treść strony (obiekt dla „single”, tablica dla „list”) — wgrywana TYLKO RAZ (pierwsze zgłoszenie),
 *   więc klient od razu widzi i edytuje to, co jest na stronie, a jego późniejsze zmiany (np. usunięte FAQ) nie wracają,
 * - webhook (https) — panel woła go po każdym zapisie klienta, żeby strona odświeżyła się od razu.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const site = await siteByKey((await params).key);
  if (!site || !secretOk(site, req.headers.get("authorization"))) return Response.json({ error: "Brak dostępu" }, { status: 401, headers: cors });
  const body = (await req.json().catch(() => null)) as { collections?: In[] } | null;
  if (!body?.collections || !Array.isArray(body.collections) || body.collections.length > 50) return Response.json({ error: "Oczekuję { collections: [...] } (max 50)" }, { status: 400, headers: cors });
  const existing = await all<{ id: string; key: string; kind: string; seeded: number | null }>("SELECT id, key, kind, seeded FROM cms_collections WHERE site_id = ?", [site.id]);
  const hook = typeof (body as { webhook?: unknown }).webhook === "string" ? String((body as { webhook: string }).webhook).trim().slice(0, 400) : "";
  if (hook && !/^https:\/\//.test(hook)) return Response.json({ error: "webhook musi zaczynać się od https://" }, { status: 400, headers: cors });
  if (hook) await run("UPDATE cms_sites SET webhook_url = ? WHERE id = ?", [hook, site.id]);
  let seededCount = 0;
  const out: string[] = [];
  for (const [i, c] of body.collections.entries()) {
    const key = slugKey(String(c.key || c.name || ""));
    const name = String(c.name || key).slice(0, 60);
    if (!key) return Response.json({ error: `Sekcja #${i + 1}: brak klucza` }, { status: 400, headers: cors });
    const kind = c.kind === "list" ? "list" : "single";
    const seen = new Set<string>();
    const fields: Field[] = [];
    for (const f of Array.isArray(c.fields) ? c.fields.slice(0, 40) : []) {
      const fk = slugKey(String(f.key || f.label || ""));
      if (!fk || seen.has(fk)) continue;
      seen.add(fk);
      const type = (TYPES.includes(f.type as FieldType) ? f.type : "text") as FieldType;
      fields.push({ key: fk, label: String(f.label || fk).slice(0, 60), type, ...(f.required ? { required: true } : {}), ...(f.help ? { help: String(f.help).slice(0, 200) } : {}) });
    }
    const item = c.item ? String(c.item).slice(0, 40) : null;
    const hint = c.hint ? String(c.hint).slice(0, 300) : null;
    const prev = existing.find((x) => x.key === key);
    let cid: string = prev?.id ?? "";
    if (prev) await run("UPDATE cms_collections SET name = ?, kind = ?, fields = ?, sort = ?, item = ?, hint = ? WHERE id = ?", [name, kind, JSON.stringify(fields), i, item, hint, prev.id]);
    else {
      cid = id();
      await run("INSERT INTO cms_collections (id, site_id, key, name, kind, fields, sort, item, hint) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [cid, site.id, key, name, kind, JSON.stringify(fields), i, item, hint]);
    }
    // treść startowa: dokładnie raz na sekcję (żeby usunięte przez klienta pozycje nie wracały)
    if (!prev?.seeded && c.defaults !== undefined) {
      const now = Date.now();
      if (kind === "single" && c.defaults && !Array.isArray(c.defaults)) {
        const data = JSON.stringify(cleanEntry(fields, c.defaults));
        const has = await all<{ id: string; data: string }>("SELECT id, data FROM cms_entries WHERE collection_id = ? LIMIT 1", [cid]);
        if (!has.length) await run("INSERT INTO cms_entries (id, collection_id, data, sort, updated_at, updated_by) VALUES (?, ?, ?, 0, ?, 'strona')", [id(), cid, data, now]);
        else if (has[0].data === "{}") await run("UPDATE cms_entries SET data = ?, updated_at = ?, updated_by = 'strona' WHERE id = ?", [data, now, has[0].id]);
      } else if (kind === "list" && Array.isArray(c.defaults)) {
        const count = await all<{ n: number }>("SELECT COUNT(*) n FROM cms_entries WHERE collection_id = ?", [cid]);
        if (!Number(count[0]?.n)) for (const [j, row] of c.defaults.slice(0, 200).entries()) await run("INSERT INTO cms_entries (id, collection_id, data, sort, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, 'strona')", [id(), cid, JSON.stringify(cleanEntry(fields, row ?? {})), j, now]);
      }
      await run("UPDATE cms_collections SET seeded = 1 WHERE id = ?", [cid]);
      seededCount++;
    }
    if (kind === "single") {
      const n = await all<{ id: string }>("SELECT id FROM cms_entries WHERE collection_id = ? LIMIT 1", [cid]);
      if (!n.length) await run("INSERT INTO cms_entries (id, collection_id, data, sort, updated_at) VALUES (?, ?, '{}', 0, ?)", [id(), cid, Date.now()]);
    }
    out.push(key);
  }
  await run("UPDATE cms_sites SET updated_at = ?, last_seen = ? WHERE id = ?", [Date.now(), Date.now(), site.id]);
  revalidatePath(`/panel/admin/strony/${site.id}`);
  revalidatePath(`/panel/strona/${site.id}`);
  return Response.json({ ok: true, collections: out, seeded: seededCount, webhook: hook || null }, { headers: { ...cors, "Cache-Control": "no-store" } });
}
