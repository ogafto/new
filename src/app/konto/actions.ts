"use server";

import { redirect } from "next/navigation";
import { all, one, run, type Invite, type User } from "@/lib/db";
import { hashPassword, id, normalizeCode, safeEqual, sha256, verifyPassword } from "@/lib/auth/crypto";
import { createSession, currentUser, destroySession } from "@/lib/auth/session";
import { sendVerification } from "@/lib/auth/verify";
import { site } from "@/lib/site";

export type FormState = { error?: string; ok?: string; fields?: Record<string, string> } | undefined;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const home = (u: Pick<User, "role">) => (u.role === "admin" ? "/panel/admin" : "/panel");
const safeNext = (v: string) => (v.startsWith("/panel") ? v : "");

// Prosty limit prób logowania (na instancję serwera)
const fails = new Map<string, { n: number; until: number }>();

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = str(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  const fields = { email };
  if (!EMAIL.test(email) || !password) return { error: "Podaj e-mail i hasło.", fields };

  const f = fails.get(email);
  if (f && f.n >= 5 && f.until > Date.now()) return { error: "Zbyt wiele prób. Spróbuj ponownie za kilka minut.", fields };

  const user = await one<User>("SELECT * FROM users WHERE email = ?", [email]);
  const ok = user ? await verifyPassword(password, user.password) : await verifyPassword(password, "scrypt$AAAA$AAAA").then(() => false);
  if (!user || !ok) {
    const n = (f && f.until > Date.now() ? f.n : 0) + 1;
    fails.set(email, { n, until: Date.now() + 10 * 60_000 });
    return { error: "Nieprawidłowy e-mail lub hasło.", fields };
  }
  fails.delete(email);

  await run("UPDATE users SET last_login_at = ? WHERE id = ?", [Date.now(), user.id]);
  await createSession(user.id);
  redirect(user.verified_at ? safeNext(str(form, "next")) || home(user) : "/konto/weryfikacja");
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const code = normalizeCode(str(form, "code"));
  const name = str(form, "name").slice(0, 80);
  const email = str(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  const fields = { code: str(form, "code"), name, email };

  if (name.length < 2) return { error: "Podaj imię.", fields };
  if (!EMAIL.test(email)) return { error: "Podaj poprawny adres e-mail.", fields };
  if (password.length < 8) return { error: "Hasło musi mieć co najmniej 8 znaków.", fields };
  if (!form.get("consent")) return { error: "Zaakceptuj regulamin i politykę prywatności.", fields };

  const existing = await one<User>("SELECT * FROM users WHERE email = ?", [email]);
  if (existing?.verified_at) return { error: "Konto z tym adresem już istnieje — zaloguj się.", fields };

  // Administrator zakłada konto bez kodu (adres z ADMIN_EMAIL, tylko jeśli nie ma jeszcze admina)
  const adminEmail = (process.env.ADMIN_EMAIL || site.email).trim().toLowerCase();
  const hasAdmin = await one("SELECT 1 FROM users WHERE role = 'admin' AND verified_at IS NOT NULL");
  const bootstrap = !!adminEmail && email === adminEmail && !hasAdmin;

  let inviteId: string | null = null;
  if (!bootstrap) {
    if (code.length !== 8) return { error: "Podaj kod z zaproszenia.", fields };
    const invites = await all<Invite>(
      "SELECT * FROM invites WHERE email = ? AND used_at IS NULL AND revoked_at IS NULL AND expires_at > ?",
      [email, Date.now()],
    );
    const match = invites.find((i) => safeEqual(i.code_hash, sha256(code)));
    if (!match) return { error: "Kod jest nieprawidłowy, wygasł albo przypisano go do innego adresu.", fields };
    inviteId = match.id;
  }

  const hash = await hashPassword(password);
  const role = bootstrap ? "admin" : "client";
  let userId = existing?.id;
  if (existing) {
    await run("UPDATE users SET name = ?, password = ?, role = ?, invite_id = ? WHERE id = ?", [name, hash, role, inviteId, existing.id]);
    await run("DELETE FROM sessions WHERE user_id = ?", [existing.id]);
  } else {
    userId = id();
    await run("INSERT INTO users (id, email, name, password, role, invite_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [userId, email, name, hash, role, inviteId, Date.now()]);
  }

  const sent = await sendVerification({ id: userId!, email, name });
  await createSession(userId!);
  if (!sent.ok) redirect("/konto/weryfikacja?blad=wysylka");
  redirect("/konto/weryfikacja");
}

export async function verify(_: FormState, form: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) redirect("/konto/logowanie");
  if (user.verified_at) redirect(home(user));

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
  redirect(`${home(user)}?witaj=1`);
}

export async function resend(): Promise<FormState> {
  const user = await currentUser();
  if (!user) redirect("/konto/logowanie");
  if (user.verified_at) redirect(home(user));
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
