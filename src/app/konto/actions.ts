"use server";

import { headers } from "next/headers";
import { all, one, run, type Invite, type User } from "@/lib/db";
import { hashPassword, id, normalizeCode, safeEqual, sha256, verifyPassword } from "@/lib/auth/crypto";
import { createSession, currentUser, destroySession, isAdmin } from "@/lib/auth/session";
import { checkAdminPassword, ensureAdminUser, isAdminEmail } from "@/lib/auth/admin";
import { sendVerification } from "@/lib/auth/verify";
import { redirect } from "next/navigation";

export type FormState = { error?: string; ok?: string; done?: string; fields?: Record<string, string> } | undefined;
export type InviteCheck = { error?: string; ok?: boolean; code?: string; email?: string; name?: string | null } | undefined;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const home = (u: Pick<User, "role" | "email">) => (isAdmin(u) ? "/panel/admin" : "/panel");
const safeNext = (v: string) => (v.startsWith("/panel") ? v : "");

// Proste limity prób (na instancję serwera)
const fails = new Map<string, { n: number; until: number }>();
function limited(key: string, max: number) {
  const f = fails.get(key);
  return !!f && f.n >= max && f.until > Date.now();
}
function fail(key: string) {
  const f = fails.get(key);
  fails.set(key, { n: (f && f.until > Date.now() ? f.n : 0) + 1, until: Date.now() + 10 * 60_000 });
}
const ip = async () => (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

async function findInvite(code: string) {
  const c = normalizeCode(code);
  if (c.length !== 8) return null;
  const rows = await all<Invite>("SELECT * FROM invites WHERE used_at IS NULL AND revoked_at IS NULL AND expires_at > ?", [Date.now()]);
  return rows.find((i) => safeEqual(i.code_hash, sha256(c))) ?? null;
}

/* ---------- logowanie ---------- */

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = str(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  const fields = { email };
  if (!EMAIL.test(email) || !password) return { error: "Podaj e-mail i hasło.", fields };
  if (limited(email, 5) || limited(await ip(), 20)) return { error: "Zbyt wiele prób. Spróbuj ponownie za kilka minut.", fields };

  // administrator — dane z .env.local
  if (isAdminEmail(email)) {
    if (!checkAdminPassword(password)) {
      fail(email);
      fail(await ip());
      return { error: "Nieprawidłowy e-mail lub hasło.", fields };
    }
    fails.delete(email);
    await createSession(await ensureAdminUser());
    return { done: safeNext(str(form, "next")) || "/panel/admin" };
  }

  const user = await one<User>("SELECT * FROM users WHERE email = ?", [email]);
  const ok = user ? await verifyPassword(password, user.password) : await verifyPassword(password, "scrypt$AAAA$AAAA").then(() => false);
  if (!user || !ok) {
    fail(email);
    fail(await ip());
    return { error: "Nieprawidłowy e-mail lub hasło.", fields };
  }
  fails.delete(email);
  await run("UPDATE users SET last_login_at = ? WHERE id = ?", [Date.now(), user.id]);
  await createSession(user.id);
  return { done: user.verified_at ? safeNext(str(form, "next")) || home(user) : "/konto/weryfikacja" };
}

/* ---------- rejestracja: 1) kod, 2) dane, 3) weryfikacja ---------- */

export async function checkInvite(_: InviteCheck, form: FormData): Promise<InviteCheck> {
  const key = `inv:${await ip()}`;
  if (limited(key, 15)) return { error: "Zbyt wiele prób. Spróbuj za kilka minut." };
  const inv = await findInvite(str(form, "code"));
  if (!inv) {
    fail(key);
    return { error: "Ten kod nie działa — sprawdź, czy jest przepisany poprawnie, albo poproś o nowy." };
  }
  return { ok: true, code: normalizeCode(str(form, "code")), email: inv.email, name: inv.name };
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const first = str(form, "first").slice(0, 60);
  const last = str(form, "last").slice(0, 60);
  const email = str(form, "email").toLowerCase();
  const phone = str(form, "phone").slice(0, 30);
  const password = String(form.get("password") ?? "");
  const fields = { first, last, email, phone };

  const inv = await findInvite(str(form, "code"));
  if (!inv) return { error: "Kod zaproszenia wygasł albo został już wykorzystany.", fields };
  if (first.length < 2 || last.length < 2) return { error: "Podaj imię i nazwisko.", fields };
  if (email !== inv.email) return { error: `Zaproszenie jest przypisane do adresu ${inv.email}.`, fields };
  if (isAdminEmail(email)) return { error: "Tego adresu nie można użyć.", fields };
  if (phone.replace(/\D/g, "").length < 9) return { error: "Podaj numer telefonu.", fields };
  if (password.length < 8) return { error: "Hasło musi mieć co najmniej 8 znaków.", fields };
  if (!form.get("consent")) return { error: "Zaakceptuj regulamin i politykę prywatności.", fields };

  const existing = await one<User>("SELECT * FROM users WHERE email = ?", [email]);
  if (existing?.verified_at) return { error: "Konto z tym adresem już istnieje — zaloguj się.", fields };

  const name = `${first} ${last}`;
  const hash = await hashPassword(password);
  let userId = existing?.id;
  if (existing) {
    await run("UPDATE users SET name = ?, phone = ?, password = ?, role = 'client', invite_id = ? WHERE id = ?", [name, phone, hash, inv.id, existing.id]);
    await run("DELETE FROM sessions WHERE user_id = ?", [existing.id]);
  } else {
    userId = id();
    await run("INSERT INTO users (id, email, name, phone, password, role, invite_id, created_at) VALUES (?, ?, ?, ?, ?, 'client', ?, ?)", [userId, email, name, phone, hash, inv.id, Date.now()]);
  }

  const sent = await sendVerification({ id: userId!, email, name });
  await createSession(userId!);
  return sent.ok ? { ok: email } : { ok: email, error: "Nie udało się wysłać maila — kliknij „Wyślij ponownie”." };
}

export async function verify(_: FormState, form: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) return { error: "Sesja wygasła — zaloguj się ponownie.", done: "/konto/logowanie" };
  if (user.verified_at) return { done: home(user) };

  const code = str(form, "code").replace(/\D/g, "");
  if (code.length !== 6) return { error: "Wpisz 6 cyfr z maila." };

  const row = await one<{ code_hash: string; expires_at: number; attempts: number }>("SELECT * FROM verification_codes WHERE user_id = ?", [user.id]);
  if (!row) return { error: "Brak aktywnego kodu — wyślij nowy." };
  if (row.attempts >= 5) return { error: "Zbyt wiele błędnych prób — wyślij nowy kod." };
  if (row.expires_at < Date.now()) return { error: "Kod wygasł — wyślij nowy." };

  if (!safeEqual(row.code_hash, sha256(`${user.id}:${code}`))) {
    await run("UPDATE verification_codes SET attempts = attempts + 1 WHERE user_id = ?", [user.id]);
    const left = 4 - row.attempts;
    return { error: left > 0 ? `Nieprawidłowy kod. Pozostało prób: ${left}.` : "Nieprawidłowy kod — wyślij nowy." };
  }

  const now = Date.now();
  await run("UPDATE users SET verified_at = ?, last_login_at = ? WHERE id = ?", [now, now, user.id]);
  await run("DELETE FROM verification_codes WHERE user_id = ?", [user.id]);
  if (user.invite_id) await run("UPDATE invites SET used_at = ? WHERE id = ?", [now, user.invite_id]);
  return { done: `${home(user)}?witaj=1` };
}

export async function resend(): Promise<FormState> {
  const user = await currentUser();
  if (!user) return { error: "Sesja wygasła — zaloguj się ponownie." };
  if (user.verified_at) return { done: home(user) };
  const row = await one<{ sent_at: number }>("SELECT sent_at FROM verification_codes WHERE user_id = ?", [user.id]);
  const wait = row ? Math.ceil((row.sent_at + 60_000 - Date.now()) / 1000) : 0;
  if (wait > 0) return { error: `Nowy kod możesz wysłać za ${wait} s.` };
  const sent = await sendVerification(user);
  return sent.ok ? { ok: `Wysłano nowy kod na ${user.email}.` } : { error: "Nie udało się wysłać maila. Spróbuj za chwilę." };
}

export async function logout() {
  await destroySession();
  redirect("/");
}
