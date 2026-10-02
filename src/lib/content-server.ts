import { one, run } from "./db";
import { applyContent, mergeContent, type Content } from "./content";

/* Treści strony — odczyt/zapis w bazie (tabela meta, klucz „content”). Tylko serwer. */

const g = globalThis as unknown as { __afto_content?: { at: number; value: Content } };
const TTL = 30_000;

export async function getContent(): Promise<Content> {
  const c = g.__afto_content;
  if (c && Date.now() - c.at < TTL) return c.value;
  let saved: Partial<Content> | null = null;
  try {
    const r = await one<{ value: string }>("SELECT value FROM meta WHERE key = 'content'");
    saved = r ? JSON.parse(r.value) : null;
  } catch {}
  const value = mergeContent(saved);
  g.__afto_content = { at: Date.now(), value };
  return value;
}

/** Wczytuje treści i podmienia je w site/services/offers (wywołuj na początku stron serwerowych) */
export async function loadContent() {
  const c = await getContent();
  applyContent(c);
  return c;
}

export type ContentVersion = { ts: number; actor: string | null; section: string; value: Content };

export async function contentHistory(): Promise<ContentVersion[]> {
  try {
    const r = await one<{ value: string }>("SELECT value FROM meta WHERE key = 'content_history'");
    return r ? (JSON.parse(r.value) as ContentVersion[]) : [];
  } catch {
    return [];
  }
}

/** Zapis z historią: poprzednia wersja trafia do listy (ostatnie 20) */
export async function saveContent(c: Content, meta: { actor?: string | null; section?: string } = {}) {
  const before = await getContent();
  const hist = await contentHistory();
  hist.unshift({ ts: Date.now(), actor: meta.actor ?? null, section: meta.section ?? "zmiana", value: before });
  await run("INSERT INTO meta (key, value) VALUES ('content_history', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [JSON.stringify(hist.slice(0, 20))]);
  const value = mergeContent(c);
  await run("INSERT INTO meta (key, value) VALUES ('content', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [JSON.stringify(value)]);
  g.__afto_content = { at: Date.now(), value };
  applyContent(value);
  return value;
}
