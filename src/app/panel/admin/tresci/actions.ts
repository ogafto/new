"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { defaultContent, type Content } from "@/lib/content";
import { contentHistory, saveContent } from "@/lib/content-server";
import { log } from "@/lib/logs";

export async function saveSiteContent(c: Content, section: string): Promise<{ ok?: string; error?: string }> {
  const admin = await requireAdmin();
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return { error: "Nieprawidłowy e-mail kontaktowy." };
  for (const s of c.socials) if (s.href && !/^https?:\/\//.test(s.href)) return { error: `${s.label}: link musi zaczynać się od https://` };
  for (const [id, s] of Object.entries(c.services)) {
    if (!Number.isFinite(Number(s.price)) || Number(s.price) < 0) return { error: `Nieprawidłowa cena (${id}).` };
    s.price = Math.round(Number(s.price));
  }
  if (c.soon.link && !/^https?:\/\//.test(c.soon.link)) return { error: "Link do Discorda musi zaczynać się od https://" };
  if (c.announcement.link && !/^(https?:\/\/|\/)/.test(c.announcement.link)) return { error: "Link ogłoszenia: adres zaczynający się od / albo https://" };
  c.steps = c.steps.map((st) => ({ ...st, points: st.points.map((x) => x.trim()).filter(Boolean) }));
  await saveContent(c, { actor: admin.email, section });
  await log("content", `Zaktualizowano treści strony: ${section}`, { actor: admin.email });
  const before = await import("@/lib/content-server").then((m) => m.contentHistory()).then((h) => h[0]?.value.soon.enabled);
  if (before !== c.soon.enabled) await log("settings", c.soon.enabled ? "Włączono tryb zapowiedzi — strona ukryta dla odwiedzających" : "Wyłączono tryb zapowiedzi — strona znów widoczna", { level: "warn", actor: admin.email });
  // cała strona korzysta z tych treści (stopka, kontakt, ceny, SEO)
  revalidatePath("/", "layout");
  return { ok: "Zapisano — zmiany są już na stronie." };
}

export async function resetSiteContent(): Promise<{ ok?: string }> {
  const admin = await requireAdmin();
  await saveContent(defaultContent(), { actor: admin.email, section: "przywrócono domyślne" });
  await log("content", "Przywrócono domyślne treści strony", { level: "warn", actor: admin.email });
  revalidatePath("/", "layout");
  return { ok: "Przywrócono domyślne treści." };
}

export async function restoreSiteContent(ts: number): Promise<{ ok?: string; error?: string; content?: Content }> {
  const admin = await requireAdmin();
  const v = (await contentHistory()).find((h) => h.ts === ts);
  if (!v) return { error: "Nie znaleziono tej wersji." };
  const saved = await saveContent(v.value, { actor: admin.email, section: "przywrócenie wersji" });
  await log("content", `Przywrócono wersję treści z ${new Date(ts).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" })}`, { level: "warn", actor: admin.email });
  revalidatePath("/", "layout");
  return { ok: "Przywrócono wersję.", content: saved };
}
