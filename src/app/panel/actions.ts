"use server";

import { cookies } from "next/headers";
import { currentUser, isAdmin, ROLE_COOKIE, setRoleCookie } from "@/lib/auth/session";

// Dla sesji sprzed wprowadzenia podpowiedzi roli — ustawia ją raz (proxy kieruje wtedy prosto do panelu)
export async function syncRole() {
  const user = await currentUser();
  if (!user?.verified_at) return;
  const role = isAdmin(user) ? "admin" : "client";
  if ((await cookies()).get(ROLE_COOKIE)?.value !== role) await setRoleCookie(role);
}

// Podgląd pełnej strony w trybie zapowiedzi — tylko dla admina (ciasteczko sprawdzane w proxy razem z sesją)
export async function setSitePreview(on: boolean) {
  const user = await currentUser();
  if (!user || !isAdmin(user)) return;
  const jar = await cookies();
  if (on) jar.set("afto_preview", "1", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  else jar.delete("afto_preview");
}

/* ---------- panel klienta ---------- */

type R = { ok?: string; error?: string };

async function clientOnly() {
  const user = await currentUser();
  if (!user?.verified_at || isAdmin(user)) return null;
  return user;
}

/** Zamówienie usługi z panelu — trafia do „Zapytań” admina (z oznaczeniem panelu) + powiadomienie */
export async function submitOrderRequest(d: { services: string[]; description: string; budget: string; timeline: string }): Promise<R> {
  const user = await clientOnly();
  if (!user) return { error: "Zaloguj się ponownie." };
  if (!d.services.length) return { error: "Wybierz co najmniej jedną usługę." };
  if (d.description.trim().length < 10) return { error: "Opisz krótko, czego potrzebujesz (min. 10 znaków)." };
  const { run } = await import("@/lib/db");
  const { id } = await import("@/lib/auth/crypto");
  const { log } = await import("@/lib/logs");
  const { setting } = await import("@/lib/settings");
  const topic = d.services.join(", ").slice(0, 300);
  await run("INSERT INTO inquiries (id, name, email, phone, topic, budget, timeline, message, created_at, user_id, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'panel')", [
    id(),
    user.name,
    user.email,
    user.phone || "",
    topic,
    d.budget.slice(0, 60) || null,
    d.timeline.slice(0, 60) || null,
    d.description.trim().slice(0, 4000),
    Date.now(),
    user.id,
  ]);
  await log("inquiry", `Zamówienie z panelu klienta: ${user.name} · ${topic}`, { level: "success", actor: user.email });
  const hook = await setting("discord_webhook");
  if (hook)
    await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "afto.works",
        allowed_mentions: { parse: [] },
        embeds: [{ title: `Nowe zamówienie z panelu — ${user.name}`, color: 0x8b6cff, fields: [{ name: "Usługi", value: topic }, ...(d.budget ? [{ name: "Budżet", value: d.budget, inline: true }] : []), ...(d.timeline ? [{ name: "Termin", value: d.timeline, inline: true }] : []), { name: "Opis", value: d.description.slice(0, 1000) }], timestamp: new Date().toISOString() }],
      }),
    }).catch(() => {});
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/panel", "layout");
  return { ok: "Zamówienie wysłane. Odezwę się wkrótce." };
}

export async function updateProfile(d: { name: string; phone: string }): Promise<R> {
  const user = await clientOnly();
  if (!user) return { error: "Zaloguj się ponownie." };
  const name = d.name.trim().slice(0, 80);
  if (name.length < 3) return { error: "Podaj imię i nazwisko." };
  if (/[0-9]/.test(name) || !/^[\p{L}][\p{L}\s'’.-]+$/u.test(name)) return { error: "Imię i nazwisko może zawierać tylko litery." };
  const { normalizePhone } = await import("@/lib/phone");
  const phone = normalizePhone(d.phone);
  if (!phone.ok) return { error: phone.error };
  const { run } = await import("@/lib/db");
  await run("UPDATE users SET name = ?, phone = ? WHERE id = ?", [name, phone.value, user.id]);
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/panel", "layout");
  return { ok: "Zapisano." };
}

export async function changePassword(d: { current: string; next: string }): Promise<R> {
  const user = await clientOnly();
  if (!user) return { error: "Zaloguj się ponownie." };
  if (d.next.length < 8) return { error: "Nowe hasło musi mieć co najmniej 8 znaków." };
  const { hashPassword, verifyPassword } = await import("@/lib/auth/crypto");
  if (!(await verifyPassword(d.current, user.password))) return { error: "Obecne hasło jest nieprawidłowe." };
  const { run } = await import("@/lib/db");
  await run("UPDATE users SET password = ? WHERE id = ?", [await hashPassword(d.next), user.id]);
  const { log } = await import("@/lib/logs");
  await log("auth", `Zmiana hasła: ${user.email}`, { actor: user.email });
  return { ok: "Hasło zmienione." };
}
