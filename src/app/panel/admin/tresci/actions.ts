"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { defaultContent, type Content } from "@/lib/content";
import { saveContent } from "@/lib/content-server";
import { log } from "@/lib/logs";

export async function saveSiteContent(c: Content, section: string): Promise<{ ok?: string; error?: string }> {
  const admin = await requireAdmin();
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return { error: "Nieprawidłowy e-mail kontaktowy." };
  for (const s of c.socials) if (s.href && !/^https?:\/\//.test(s.href)) return { error: `${s.label}: link musi zaczynać się od https://` };
  for (const [id, s] of Object.entries(c.services)) {
    if (!Number.isFinite(Number(s.price)) || Number(s.price) < 0) return { error: `Nieprawidłowa cena (${id}).` };
    s.price = Math.round(Number(s.price));
  }
  await saveContent(c);
  await log("content", `Zaktualizowano treści strony: ${section}`, { actor: admin.email });
  // cała strona korzysta z tych treści (stopka, kontakt, ceny, SEO)
  revalidatePath("/", "layout");
  return { ok: "Zapisano — zmiany są już na stronie." };
}

export async function resetSiteContent(): Promise<{ ok?: string }> {
  const admin = await requireAdmin();
  await saveContent(defaultContent());
  await log("content", "Przywrócono domyślne treści strony", { level: "warn", actor: admin.email });
  revalidatePath("/", "layout");
  return { ok: "Przywrócono domyślne treści." };
}
