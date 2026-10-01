import { one, run, type User } from "../db";
import { hashPassword, id, safeEqual, sha256, token } from "./crypto";

/*
 * Jedno konto administratora — dane w .env.local:
 *   ADMIN_EMAIL=…  ADMIN_PASSWORD=…
 * Hasło nie trafia do bazy; logowanie porównuje je z wartością z env.
 */

export const adminEmail = () => (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
export const isAdminEmail = (email: string) => !!adminEmail() && email.trim().toLowerCase() === adminEmail();

export function checkAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false;
  return safeEqual(sha256(password), sha256(expected));
}

// Wiersz administratora w bazie (potrzebny do sesji); tworzony przy pierwszym logowaniu
export async function ensureAdminUser() {
  const email = adminEmail();
  const now = Date.now();
  const existing = await one<User>("SELECT * FROM users WHERE email = ?", [email]);
  if (existing) {
    await run("UPDATE users SET role = 'admin', verified_at = COALESCE(verified_at, ?), last_login_at = ? WHERE id = ?", [now, now, existing.id]);
    return existing.id;
  }
  const uid = id();
  await run("INSERT INTO users (id, email, name, password, role, verified_at, created_at, last_login_at) VALUES (?, ?, ?, ?, 'admin', ?, ?, ?)", [
    uid,
    email,
    process.env.ADMIN_NAME || "Administrator",
    await hashPassword(token()),
    now,
    now,
    now,
  ]);
  return uid;
}
