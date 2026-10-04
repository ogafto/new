import { revalidatePath } from "next/cache";
import { id } from "@/lib/auth/crypto";
import { all, run } from "@/lib/db";
import { alignKeys, apiKey, cleanEntry, FIELD_TYPES, secretOk, siteByKey, slugKey, type Field, type FieldType } from "@/lib/cms";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

const TYPES = FIELD_TYPES.map((t) => t.type) as FieldType[];
type In = { key?: string; name?: string; kind?: string; item?: string; hint?: string; fields?: { key?: string; label?: string; type?: string; required?: boolean; help?: string }[]; defaults?: unknown };

// Aktualny schemat (sekcje, pola i ile treści) — z kluczem sekretnym
export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const site = await siteByKey((await params).key);
  if (!site || !secretOk(site, req.headers.get("authorization"))) return Response.json({ error: "Brak dostępu" }, { status: 401, headers: cors });
  const cols = await all<{ id: string; key: string; name: string; kind: string; fields: string; item: string | null; hint: string | null; seeded: number | null }>("SELECT id, key, name, kind, item, hint, seeded, fields FROM cms_collections WHERE site_id = ? ORDER BY sort", [site.id]);
  const out = [];
  for (const c of cols) {
    const n = await all<{ n: number }>("SELECT COUNT(*) n FROM cms_entries WHERE collection_id = ? AND data != '{}'", [c.id]);
    out.push({ key: c.key, name: c.name, kind: c.kind, item: c.item, hint: c.hint, seeded: !!c.seeded, entries: Number(n[0]?.n ?? 0), fields: JSON.parse(c.fields) });
  }
  return Response.json({ collections: out }, { headers: { ...cors, "Cache-Control": "no-store" } });
}

const empty = (data: string) => {
  try {
    return Object.values(JSON.parse(data) as Record<string, unknown>).every((v) => v === null || v === "" || v === false);
  } catch {
    return true;
  }
};

/*
 * Strona klienta zgłasza, co ma być edytowalne:
 *   { webhook?: "https://…/api/revalidate?token=…",
 *     collections: [{ key, name, kind, item?, hint?, fields: [{ key, label, type, required?, help? }], defaults? }] }
 * - klucze zostają 1:1 tak, jak je wysłała strona (np. heroTitle) — treść z API ma te same nazwy co w kodzie strony,
 * - defaults = obecna treść strony (obiekt dla „single”, tablica dla „list”), dopasowywana do pól nawet przy innej pisowni kluczy;
 *   wgrywana TYLKO RAZ na sekcję (później zmiany klienta, także usunięcia, nie są nadpisywane),
 * - sekcje spoza zgłoszenia, które są puste (np. z szablonu przy zakładaniu strony), są usuwane — klient widzi tylko to, co strona naprawdę ma,
 * - webhook (https) — panel woła go po każdym zapisie klienta.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const site = await siteByKey((await params).key);
  if (!site || !secretOk(site, req.headers.get("authorization"))) return Response.json({ error: "Brak dostępu" }, { status: 401, headers: cors });
  const body = (await req.json().catch(() => null)) as { collections?: In[]; webhook?: unknown } | null;
  if (!body?.collections || !Array.isArray(body.collections) || body.collections.length > 50) return Response.json({ error: "Oczekuję { collections: [...] } (max 50)" }, { status: 400, headers: cors });
  const hook = typeof body.webhook === "string" ? body.webhook.trim().slice(0, 400) : "";
  if (hook && !/^https:\/\//.test(hook)) return Response.json({ error: "webhook musi zaczynać się od https://" }, { status: 400, headers: cors });

  const existing = await all<{ id: string; key: string; seeded: number | null }>("SELECT id, key, seeded FROM cms_collections WHERE site_id = ?", [site.id]);
  const out: { key: string; fields: number; seeded: number }[] = [];
  const warnings: string[] = [];
  const now = Date.now();

  for (const [i, c] of body.collections.entries()) {
    const key = apiKey(String(c.key ?? "")) || slugKey(String(c.name ?? ""));
    if (!key) return Response.json({ error: `Sekcja #${i + 1}: brak klucza` }, { status: 400, headers: cors });
    const name = String(c.name || key).slice(0, 60);
    const kind = c.kind === "list" ? "list" : "single";
    const seen = new Set<string>();
    const fields: Field[] = [];
    for (const f of Array.isArray(c.fields) ? c.fields.slice(0, 40) : []) {
      const fk = apiKey(String(f.key ?? "")) || slugKey(String(f.label ?? ""));
      if (!fk || seen.has(fk)) continue;
      seen.add(fk);
      const type = (TYPES.includes(f.type as FieldType) ? f.type : "text") as FieldType;
      fields.push({ key: fk, label: String(f.label || fk).slice(0, 60), type, ...(f.required ? { required: true } : {}), ...(f.help ? { help: String(f.help).slice(0, 200) } : {}) });
    }
    if (!fields.length) warnings.push(`${key}: brak pól — klient nie będzie miał czego edytować`);
    const item = c.item ? String(c.item).slice(0, 40) : null;
    const hint = c.hint ? String(c.hint).slice(0, 300) : null;
    // ta sama sekcja mogła wcześniej dostać klucz małymi literami — dopasuj luźno, żeby nie dublować
    const prev = existing.find((x) => x.key === key) ?? existing.find((x) => x.key.toLowerCase().replace(/_/g, "") === key.toLowerCase().replace(/_/g, ""));
    let cid: string = prev?.id ?? "";
    if (prev) await run("UPDATE cms_collections SET key = ?, name = ?, kind = ?, fields = ?, sort = ?, item = ?, hint = ? WHERE id = ?", [key, name, kind, JSON.stringify(fields), i, item, hint, prev.id]);
    else {
      cid = id();
      await run("INSERT INTO cms_collections (id, site_id, key, name, kind, fields, sort, item, hint) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [cid, site.id, key, name, kind, JSON.stringify(fields), i, item, hint]);
    }

    // treść startowa — raz na sekcję; tolerancyjnie: obiekt/tablica w obu formach, klucze w dowolnej pisowni
    let seeded = 0;
    let def = c.defaults;
    if (kind === "list" && def && !Array.isArray(def) && typeof def === "object") def = Object.values(def as object).find(Array.isArray) ?? [def];
    if (kind === "single" && Array.isArray(def)) def = def[0];
    const entries = await all<{ id: string; data: string }>("SELECT id, data FROM cms_entries WHERE collection_id = ?", [cid]);
    const blank = entries.every((e) => empty(e.data));
    // lista: tylko przy pierwszym zgłoszeniu (klient mógł świadomie usunąć wszystko), pojedyncza: także gdy wciąż pusta
    if (def !== undefined && def !== null && (kind === "list" ? !prev?.seeded && blank : !prev?.seeded || blank)) {
      if (kind === "single") {
        const data = JSON.stringify(cleanEntry(fields, alignKeys(fields, def)));
        if (!entries.length) await run("INSERT INTO cms_entries (id, collection_id, data, sort, updated_at, updated_by) VALUES (?, ?, ?, 0, ?, 'strona')", [id(), cid, data, now]);
        else if (blank) await run("UPDATE cms_entries SET data = ?, updated_at = ?, updated_by = 'strona' WHERE id = ?", [data, now, entries[0].id]);
        seeded = empty(data) ? 0 : 1;
      } else if (Array.isArray(def) && blank) {
        await run("DELETE FROM cms_entries WHERE collection_id = ?", [cid]);
        for (const [j, row] of def.slice(0, 200).entries()) {
          const data = JSON.stringify(cleanEntry(fields, alignKeys(fields, row)));
          if (empty(data)) continue;
          await run("INSERT INTO cms_entries (id, collection_id, data, sort, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, 'strona')", [id(), cid, data, j, now]);
          seeded++;
        }
      }
      if (seeded) await run("UPDATE cms_collections SET seeded = 1 WHERE id = ?", [cid]);
      else warnings.push(`${key}: defaults nie pasują do pól (${fields.map((f) => f.key).join(", ")}) — nic nie wgrano`);
    } else if (def === undefined && blank) warnings.push(`${key}: brak defaults — sekcja w panelu jest pusta; wyślij obecną treść strony w "defaults"`);

    if (kind === "single" && !(await all<{ id: string }>("SELECT id FROM cms_entries WHERE collection_id = ? LIMIT 1", [cid])).length)
      await run("INSERT INTO cms_entries (id, collection_id, data, sort, updated_at) VALUES (?, ?, '{}', 0, ?)", [id(), cid, now]);
    out.push({ key, fields: fields.length, seeded });
  }

  // puste sekcje spoza zgłoszenia (np. z szablonu przy zakładaniu strony) — usuń, żeby klient nie widział pustych formularzy
  const keep = new Set(out.map((x) => x.key));
  const removed: string[] = [];
  for (const c of await all<{ id: string; key: string }>("SELECT id, key FROM cms_collections WHERE site_id = ?", [site.id])) {
    if (keep.has(c.key)) continue;
    const e = await all<{ data: string }>("SELECT data FROM cms_entries WHERE collection_id = ?", [c.id]);
    if (e.every((x) => empty(x.data))) {
      await run("DELETE FROM cms_entries WHERE collection_id = ?", [c.id]);
      await run("DELETE FROM cms_collections WHERE id = ?", [c.id]);
      removed.push(c.key);
    }
  }

  await run(`UPDATE cms_sites SET updated_at = ?, last_seen = ?, schema_at = ?${hook ? ", webhook_url = ?" : ""} WHERE id = ?`, hook ? [now, now, now, hook, site.id] : [now, now, now, site.id]);
  revalidatePath(`/panel/admin/strony/${site.id}`);
  revalidatePath(`/panel/strona/${site.id}`);
  return Response.json({ ok: true, collections: out, removed, warnings, webhook: hook || null }, { headers: { ...cors, "Cache-Control": "no-store" } });
}
