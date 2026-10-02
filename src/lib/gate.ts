import { one } from "./db";
import { getContent } from "./content-server";
import { sha256 } from "./auth/crypto";
import { isAdminEmail } from "./auth/admin";

/*
 * Tryb „Coś nowego nadchodzi” (Panel → Treści strony → Tryb zapowiedzi).
 * Sprawdzane w proxy przy każdym wejściu na publiczną stronę — dlatego z krótką pamięcią podręczną.
 * Admin z ważną sesją widzi pełną stronę; panel i logowanie działają dla wszystkich.
 */

export async function soonEnabled() {
  try {
    return (await getContent()).soon.enabled;
  } catch {
    return false; // problem z bazą nie może wyłączyć strony
  }
}

const g = globalThis as unknown as { __afto_admins?: Map<string, { ok: boolean; at: number }> };
const cache = (g.__afto_admins ??= new Map());

export async function isAdminToken(token: string | undefined) {
  if (!token) return false;
  const key = sha256(token);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 60_000) return hit.ok;
  let ok = false;
  try {
    const r = await one<{ role: string; email: string; expires_at: number }>("SELECT u.role, u.email, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?", [key]);
    ok = !!r && r.role === "admin" && isAdminEmail(r.email) && Number(r.expires_at) > Date.now();
  } catch {}
  if (cache.size > 500) cache.clear();
  cache.set(key, { ok, at: Date.now() });
  return ok;
}
