"use server";

import { headers } from "next/headers";
import { createSession, destroySession, setRoleCookie } from "@/lib/auth/session";
import { checkAdminPassword, ensureAdminUser, isAdminEmail } from "@/lib/auth/admin";
import { redirect } from "next/navigation";
import { log } from "@/lib/logs";

export type FormState = { error?: string; ok?: string; done?: string; fields?: Record<string, string> } | undefined;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
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

/* ---------- logowanie ---------- */

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = str(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  const fields = { email };
  if (!EMAIL.test(email) || !password) return { error: "Podaj e-mail i hasło.", fields };
  if (limited(email, 5) || limited(await ip(), 20)) {
    await log("auth", `Zablokowano logowanie (za dużo prób): ${email}`, { level: "warn", ip: await ip() });
    return { error: "Zbyt wiele prób. Spróbuj ponownie za kilka minut.", fields };
  }

  // administrator — dane z env (ADMIN_EMAIL / ADMIN_PASSWORD)
  if (isAdminEmail(email)) {
    if (!checkAdminPassword(password)) {
      fail(email);
      fail(await ip());
      await log("auth", "Nieudane logowanie na konto administratora", { level: "warn", actor: email, ip: await ip() });
      return { error: "Nieprawidłowy e-mail lub hasło.", fields };
    }
    fails.delete(email);
    await createSession(await ensureAdminUser());
    await setRoleCookie("admin");
    await log("auth", "Zalogowano: administrator", { level: "success", actor: email, ip: await ip() });
    return { done: safeNext(str(form, "next")) || "/panel/admin" };
  }

  // panel jest tylko dla administratora (konta klientów wyłączone)
  fail(email);
  fail(await ip());
  await log("auth", `Nieudane logowanie: ${email}`, { level: "warn", actor: email, ip: await ip() });
  return { error: "Nieprawidłowy e-mail lub hasło.", fields };
}

export async function logout() {
  await destroySession();
  redirect("/");
}
