"use server";

import { revalidatePath } from "next/cache";
import { createElement } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { log } from "@/lib/logs";
import { saveSetting, setting, SETTINGS, type SettingGroup } from "@/lib/settings";
import { site } from "@/lib/site";
import { stripeCheck } from "@/lib/stripe";
import { zl } from "@/lib/finance";

export type SaveResult = { ok?: string; error?: string } | undefined;

/** Zapis grupy ustawień. Puste pole sekretu = bez zmian (chyba że zaznaczone „usuń”). */
export async function saveSettings(group: SettingGroup, values: Record<string, string>, clear: string[] = []): Promise<SaveResult> {
  const admin = await requireAdmin();
  const defs = SETTINGS.filter((s) => s.group === group);
  const changed: string[] = [];
  for (const def of defs) {
    const v = (values[def.key] ?? "").trim();
    if (clear.includes(def.key)) {
      await saveSetting(def.key, "");
      changed.push(`${def.label} (usunięto)`);
      continue;
    }
    if (def.secret && !v) continue;
    if (def.type === "url" && v && !/^https?:\/\//.test(v)) return { error: `${def.label}: adres musi zaczynać się od https://` };
    if (def.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { error: `${def.label}: nieprawidłowy e-mail.` };
    if (def.key === "stripe_secret_key" && v && !/^(sk|rk)_(test|live)_/.test(v)) return { error: "Klucz Stripe powinien zaczynać się od sk_test_ / sk_live_ (albo rk_ dla klucza ograniczonego)." };
    if (def.key === "stripe_webhook_secret" && v && !v.startsWith("whsec_")) return { error: "Sekret webhooka zaczyna się od whsec_." };
    if (def.key === "discord_webhook" && v && !/^https:\/\/(\w+\.)?discord(app)?\.com\/api\/webhooks\//.test(v)) return { error: "To nie wygląda na webhook Discorda (https://discord.com/api/webhooks/…)." };
    const before = await setting(def.key);
    if (v !== before) {
      await saveSetting(def.key, v);
      changed.push(def.label);
    }
  }
  if (changed.length) await log("settings", `Zmieniono ustawienia: ${changed.join(", ")}`, { actor: admin.email });
  // adres strony, GA i weryfikacja Google trafiają do szablonu strony
  if (group === "analytics" || group === "general") revalidatePath("/", "layout");
  revalidatePath("/panel/admin/ustawienia");
  return { ok: changed.length ? "Zapisano." : "Bez zmian." };
}

export async function testConnection(kind: "mail" | "discord" | "stripe"): Promise<SaveResult> {
  const admin = await requireAdmin();
  try {
    if (kind === "stripe") {
      const r = await stripeCheck();
      await log("settings", `Test Stripe: OK (${r.live ? "tryb live" : "tryb testowy"})`, { level: "success", actor: admin.email });
      return { ok: `Połączono — ${r.live ? "tryb LIVE" : "tryb testowy"}. Saldo: ${zl(r.available)} (w drodze ${zl(r.pending)}).` };
    }
    if (kind === "discord") {
      const url = await setting("discord_webhook");
      if (!url) return { error: "Najpierw zapisz webhook." };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: site.domain, allowed_mentions: { parse: [] }, embeds: [{ title: "Test połączenia", description: "Powiadomienia z panelu afto. działają ✓", color: 0x8b6cff }] }),
      });
      if (!res.ok) throw new Error(`Discord odpowiedział HTTP ${res.status}`);
      await log("settings", "Test Discord: OK", { level: "success", actor: admin.email });
      return { ok: "Wysłano wiadomość testową na kanał." };
    }
    const { sendMail, baseUrl } = await import("@/lib/mail");
    const { default: TestEmail } = await import("@/emails/TestEmail");
    const to = (await setting("notify_email")) || admin.email;
    const r = await sendMail({ to, subject: "Test wysyłki — panel afto.", react: createElement(TestEmail, { baseUrl: await baseUrl() }) });
    if (!r.ok) throw new Error("Resend odrzucił wiadomość — sprawdź klucz i zweryfikowaną domenę nadawcy.");
    await log("settings", `Test e-mail: wysłano do ${to}`, { level: "success", actor: admin.email });
    return { ok: r.dev ? "Brak klucza — w trybie dev treść wypisano w konsoli serwera." : `Wysłano maila testowego na ${to}.` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await log("settings", `Test ${kind}: błąd — ${msg}`, { level: "error", actor: admin.email });
    return { error: msg };
  }
}
