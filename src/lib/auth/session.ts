import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { one, run, type User } from "../db";
import { sha256, token } from "./crypto";
import { isAdminEmail } from "./admin";

export const SESSION_COOKIE = "afto_session";
const DAY = 24 * 60 * 60 * 1000;
const TTL = 30 * DAY;

export async function createSession(userId: string) {
  const t = token();
  const now = Date.now();
  await run("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)", [sha256(t), userId, now + TTL, now]);
  (await cookies()).set(SESSION_COOKIE, t, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(now + TTL),
  });
}

export async function destroySession() {
  const jar = await cookies();
  const t = jar.get(SESSION_COOKIE)?.value;
  if (t) await run("DELETE FROM sessions WHERE id = ?", [sha256(t)]);
  jar.delete(SESSION_COOKIE);
}

// Zalogowany użytkownik (lub null) — raz na żądanie
export const currentUser = cache(async (): Promise<User | null> => {
  const t = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!t) return null;
  const row = await one<User & { expires_at: number }>(
    "SELECT u.*, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?",
    [sha256(t)],
  );
  if (!row || row.expires_at < Date.now()) return null;
  return row;
});

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/konto/logowanie");
  if (!user.verified_at) redirect("/konto/weryfikacja");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/panel");
  return user;
}

// administrator = rola admin + adres z ADMIN_EMAIL (jest tylko jeden)
export const isAdmin = (u: Pick<User, "role" | "email">) => u.role === "admin" && isAdminEmail(u.email);
