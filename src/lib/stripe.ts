import { createHmac, timingSafeEqual } from "node:crypto";
import { setting } from "./settings";

/*
 * Stripe przez REST API (bez SDK). Dla klientów tworzymy Payment Link — link nie wygasa,
 * można go wysłać mailem/na Discordzie, a po opłaceniu Stripe woła nasz webhook.
 * Metody płatności (karta, BLIK, Przelewy24…) włączasz w Stripe → Settings → Payment methods.
 */

const API = "https://api.stripe.com/v1";

export class StripeError extends Error {}

function form(data: Record<string, unknown>, prefix = ""): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") out.push(...form(v as Record<string, unknown>, key));
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return out;
}

async function call<T>(method: "GET" | "POST", path: string, data?: Record<string, unknown>, key?: string): Promise<T> {
  const secret = key ?? (await setting("stripe_secret_key"));
  if (!secret) throw new StripeError("Stripe nie jest podłączony — dodaj klucz w Panel → Ustawienia → Płatności.");
  const body = data ? form(data).join("&") : undefined;
  const url = method === "GET" && body ? `${API}${path}?${body}` : `${API}${path}`;
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded", "Stripe-Version": "2024-06-20" },
    body: method === "POST" ? body : undefined,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } } & T;
  if (!res.ok) throw new StripeError(json.error?.message || `Stripe: HTTP ${res.status}`);
  return json;
}

export const stripeReady = async () => !!(await setting("stripe_secret_key"));

/** Test klucza: saldo konta + tryb (test/live) */
export async function stripeCheck(key?: string) {
  const b = await call<{ livemode: boolean; available: { amount: number; currency: string }[]; pending: { amount: number; currency: string }[] }>("GET", "/balance", undefined, key);
  const sum = (l: { amount: number; currency: string }[]) => l.filter((x) => x.currency === "pln").reduce((a, x) => a + x.amount, 0);
  return { live: b.livemode, available: sum(b.available), pending: sum(b.pending) };
}

/** Link do płatności za konkretną pozycję (kwota w groszach) */
export async function createPaymentLink(p: { id: string; title: string; amount: number; email?: string | null; baseUrl: string }) {
  const price = await call<{ id: string }>("POST", "/prices", {
    currency: "pln",
    unit_amount: p.amount,
    product_data: { name: p.title.slice(0, 250) },
  });
  const link = await call<{ id: string; url: string }>("POST", "/payment_links", {
    line_items: { 0: { price: price.id, quantity: 1 } },
    metadata: { payment_id: p.id },
    payment_intent_data: { metadata: { payment_id: p.id }, description: p.title.slice(0, 250) },
    after_completion: { type: "redirect", redirect: { url: `${p.baseUrl}/platnosc?status=ok` } },
    restrictions: { completed_sessions: { limit: 1 } },
  });
  return link;
}

export async function deactivateLink(linkId: string) {
  await call("POST", `/payment_links/${linkId}`, { active: false }).catch(() => {});
}

/** Ręczne sprawdzenie, czy link został opłacony (gdy webhook nie jest skonfigurowany) */
export async function findPaidSession(linkId: string) {
  const r = await call<{ data: { id: string; payment_status: string; payment_intent: string | null; created: number }[] }>("GET", "/checkout/sessions", { payment_link: linkId, limit: 10 });
  return r.data.find((s) => s.payment_status === "paid") ?? null;
}

/** Weryfikacja podpisu webhooka (nagłówek Stripe-Signature) */
export function verifyWebhook(payload: string, header: string | null, secret: string, toleranceSec = 300) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]).filter((x) => x.length === 2));
  const t = Number(parts.t);
  const sigs = header
    .split(",")
    .filter((kv) => kv.startsWith("v1="))
    .map((kv) => kv.slice(3));
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  return sigs.some((s) => s.length === expected.length && timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}
