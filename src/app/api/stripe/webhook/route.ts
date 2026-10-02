import { one, run } from "@/lib/db";
import { markPaid, type Payment } from "@/lib/finance";
import { log } from "@/lib/logs";
import { setting } from "@/lib/settings";
import { verifyWebhook } from "@/lib/stripe";

/*
 * Webhook Stripe: https://twoja-domena/api/stripe/webhook
 * Zdarzenia: checkout.session.completed, checkout.session.async_payment_succeeded,
 * checkout.session.async_payment_failed, charge.refunded
 */

type Session = { id: string; payment_status: string; payment_link: string | null; payment_intent: string | null; metadata?: Record<string, string> };

async function findPayment(s: Session) {
  const pid = s.metadata?.payment_id;
  if (pid) return one<Payment>("SELECT * FROM payments WHERE id = ?", [pid]);
  if (s.payment_link) return one<Payment>("SELECT * FROM payments WHERE stripe_session = ?", [s.payment_link]);
  return null;
}

export async function POST(req: Request) {
  const secret = await setting("stripe_webhook_secret");
  const payload = await req.text();
  if (!secret) {
    await log("payment", "Webhook Stripe odrzucony — brak sekretu webhooka w ustawieniach", { level: "warn" });
    return new Response("Webhook secret not configured", { status: 503 });
  }
  if (!verifyWebhook(payload, req.headers.get("stripe-signature"), secret)) {
    await log("payment", "Webhook Stripe z nieprawidłowym podpisem", { level: "error", ip: req.headers.get("x-forwarded-for")?.split(",")[0] ?? null });
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(payload) as { type: string; data: { object: Record<string, unknown> } };
  const obj = event.data.object;

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const s = obj as unknown as Session;
    const p = await findPayment(s);
    if (!p) await log("payment", `Wpłata Stripe bez powiązanej pozycji (${s.id})`, { level: "warn" });
    else if (s.payment_status === "paid") await markPaid(p.id, { via: "webhook", stripePayment: s.payment_intent });
    else await log("payment", `Płatność w toku: ${p.title} (${p.client_name}) — czeka na potwierdzenie banku`, { meta: { session: s.id } });
  } else if (event.type === "checkout.session.async_payment_failed") {
    const s = obj as unknown as Session;
    const p = await findPayment(s);
    await log("payment", `Płatność nieudana${p ? `: ${p.title} (${p.client_name})` : ""}`, { level: "error", meta: { session: s.id } });
  } else if (event.type === "charge.refunded") {
    const pi = obj.payment_intent as string | undefined;
    const full = obj.refunded === true;
    if (pi && full) {
      const p = await one<Payment>("SELECT * FROM payments WHERE stripe_payment = ?", [pi]);
      if (p) {
        await run("UPDATE payments SET status = 'refunded' WHERE id = ?", [p.id]);
        await log("payment", `Zwrot: ${p.title} (${p.client_name})`, { level: "warn" });
      }
    }
  }
  return Response.json({ received: true });
}
