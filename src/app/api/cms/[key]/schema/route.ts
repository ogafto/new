import { revalidatePath } from "next/cache";
import { id } from "@/lib/auth/crypto";
import { all, run } from "@/lib/db";
import { FIELD_TYPES, secretOk, siteByKey, slugKey, type Field, type FieldType } from "@/lib/cms";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

const TYPES = FIELD_TYPES.map((t) => t.type) as FieldType[];
type In = { key: string; name: string; kind?: "single" | "list"; fields: { key: string; label: string; type: string; required?: boolean; help?: string }[] };

// Aktualny schemat (sekcje i pola) — z kluczem sekretnym
export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const site = await siteByKey((await params).key);
  if (!site || !secretOk(site, req.headers.get("authorization"))) return Response.json({ error: "Brak dostępu" }, { status: 401, headers: cors });
  const cols = await all<{ key: string; name: string; kind: string; fields: string }>("SELECT key, name, kind, fields FROM cms_collections WHERE site_id = ? ORDER BY sort", [site.id]);
  return Response.json({ collections: cols.map((c) => ({ ...c, fields: JSON.parse(c.fields) })) }, { headers: { ...cors, "Cache-Control": "no-store" } });
}

/*
 * Strona klienta zgłasza, co ma być edytowalne: { collections: [{ key, name, kind, fields: [{ key, label, type, required?, help? }] }] }.
 * Sekcje są dopisywane albo aktualizowane (po kluczu) — nic nie jest usuwane, treści zostają.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const site = await siteByKey((await params).key);
  if (!site || !secretOk(site, req.headers.get("authorization"))) return Response.json({ error: "Brak dostępu" }, { status: 401, headers: cors });
  const body = (await req.json().catch(() => null)) as { collections?: In[] } | null;
  if (!body?.collections || !Array.isArray(body.collections) || body.collections.length > 50) return Response.json({ error: "Oczekuję { collections: [...] } (max 50)" }, { status: 400, headers: cors });
  const existing = await all<{ id: string; key: string; kind: string }>("SELECT id, key, kind FROM cms_collections WHERE site_id = ?", [site.id]);
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
    const prev = existing.find((x) => x.key === key);
    if (prev) await run("UPDATE cms_collections SET name = ?, kind = ?, fields = ?, sort = ? WHERE id = ?", [name, kind, JSON.stringify(fields), i, prev.id]);
    else {
      const cid = id();
      await run("INSERT INTO cms_collections (id, site_id, key, name, kind, fields, sort) VALUES (?, ?, ?, ?, ?, ?, ?)", [cid, site.id, key, name, kind, JSON.stringify(fields), i]);
      if (kind === "single") await run("INSERT INTO cms_entries (id, collection_id, data, sort, updated_at) VALUES (?, ?, '{}', 0, ?)", [id(), cid, Date.now()]);
    }
    // sekcja zmieniona na pojedynczą bez wpisu — dodaj pusty, żeby klient mógł ją wypełnić
    if (prev && kind === "single") {
      const n = await all<{ id: string }>("SELECT id FROM cms_entries WHERE collection_id = ? LIMIT 1", [prev.id]);
      if (!n.length) await run("INSERT INTO cms_entries (id, collection_id, data, sort, updated_at) VALUES (?, ?, '{}', 0, ?)", [id(), prev.id, Date.now()]);
    }
    out.push(key);
  }
  await run("UPDATE cms_sites SET updated_at = ?, last_seen = ? WHERE id = ?", [Date.now(), Date.now(), site.id]);
  revalidatePath(`/panel/admin/strony/${site.id}`);
  revalidatePath(`/panel/strona/${site.id}`);
  return Response.json({ ok: true, collections: out }, { headers: { ...cors, "Cache-Control": "no-store" } });
}
