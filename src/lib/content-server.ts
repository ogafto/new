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

export async function saveContent(c: Content) {
  const value = mergeContent(c);
  await run("INSERT INTO meta (key, value) VALUES ('content', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [JSON.stringify(value)]);
  g.__afto_content = { at: Date.now(), value };
  applyContent(value);
  return value;
}
