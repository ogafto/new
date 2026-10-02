import { Resend } from "resend";
import { site } from "@/lib/site";
import { setting } from "@/lib/settings";
import { log } from "@/lib/logs";
import { run } from "@/lib/db";
import { id } from "@/lib/auth/crypto";
import { loadContent } from "@/lib/content-server";

type Payload = {
  name: string;
  email: string;
  phone: string;
  firm: string;
  topic: string;
  budget: string;
  timeline: string;
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Prosty limit: maks. 5 zapytań na 10 minut z jednego IP (w obrębie jednej instancji serwera).
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 1000) {
    for (const [key, times] of hits) if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
  }
  return recent.length > LIMIT;
}

function str(v: unknown, max: number) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function validate(body: Record<string, unknown>): Payload | string {
  const data = {
    name: str(body.name, 80),
    email: str(body.email, 160),
    phone: str(body.phone, 30),
    firm: str(body.firm, 120),
    topic: str(body.topic, 300),
    budget: str(body.budget, 60),
    timeline: str(body.timeline, 60),
    message: str(body.message, 3000),
  };
  if (data.name.length < 2) return "Podaj imię.";
  if (!EMAIL_RE.test(data.email)) return "Podaj poprawny adres e-mail.";
  if (data.phone.replace(/\D/g, "").length < 9) return "Podaj numer telefonu.";
  if (data.message.length < 10) return "Wiadomość jest za krótka (min. 10 znaków).";
  return data;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function emailHtml(d: Payload) {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:10px 0;color:#8b8b94;font-size:13px;width:110px;vertical-align:top">${k}</td><td style="padding:10px 0;color:#111;font-size:15px">${escapeHtml(v) || "—"}</td></tr>`;
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7">
    <div style="background:#060607;padding:24px 28px;color:#fff">
      <div style="font-size:12px;color:#8b8b94;letter-spacing:.08em;text-transform:uppercase">${site.domain}</div>
      <div style="font-size:22px;margin-top:6px">Nowe zapytanie od ${escapeHtml(d.name)}</div>
    </div>
    <div style="padding:20px 28px">
      <table style="width:100%;border-collapse:collapse">
        ${row("Imię", d.name)}${row("E-mail", d.email)}${row("Telefon", d.phone)}${row("Firma", d.firm)}${row("Usługi", d.topic)}${row("Budżet", d.budget)}${row("Termin", d.timeline)}
      </table>
      <div style="margin-top:12px;padding:16px;background:#f4f4f5;border-radius:12px;color:#111;font-size:15px;line-height:1.6;white-space:pre-wrap">${escapeHtml(d.message)}</div>
      <p style="color:#8b8b94;font-size:12px;margin-top:20px">Kliknij „Odpowiedz”, aby napisać bezpośrednio do klienta.</p>
    </div>
  </div></body></html>`;
}

async function sendResend(d: Payload) {
  const [key, from, to] = await Promise.all([setting("resend_api_key"), setting("contact_from"), setting("contact_to")]);
  if (!key) return null;
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: from || `${site.domain} <formularz@${site.domain}>`,
    to: to || site.email,
    replyTo: d.email,
    subject: `Nowe zapytanie — ${d.name}`,
    html: emailHtml(d),
    text: `Imię: ${d.name}\nE-mail: ${d.email}\nTelefon: ${d.phone || "—"}\nFirma: ${d.firm || "—"}\nUsługi: ${d.topic || "—"}\nBudżet: ${d.budget || "—"}\nTermin: ${d.timeline || "—"}\n\n${d.message}`,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
  return true;
}

async function sendDiscord(d: Payload) {
  const url = await setting("discord_webhook");
  if (!url) return null;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: site.domain,
      // Blokuje @everyone / @here / wzmianki wstrzyknięte w treść formularza.
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: `Nowe zapytanie — ${d.name}`,
          color: 0x8b6cff,
          fields: [
            { name: "Imię", value: d.name, inline: true },
            { name: "E-mail", value: d.email, inline: true },
            { name: "Telefon", value: d.phone || "—", inline: true },
            ...(d.firm ? [{ name: "Firma", value: d.firm, inline: true }] : []),
            ...(d.topic ? [{ name: "Usługi", value: d.topic.slice(0, 1024) }] : []),
            ...(d.budget ? [{ name: "Budżet", value: d.budget, inline: true }] : []),
            ...(d.timeline ? [{ name: "Termin", value: d.timeline, inline: true }] : []),
            { name: "Wiadomość", value: d.message.slice(0, 1024) },
          ],
          footer: { text: site.domain },
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Discord: HTTP ${res.status}`);
  return true;
}

export async function POST(req: Request) {
  await loadContent();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  // Honeypot — ukryte pole, które wypełniają tylko boty.
  if (str(body.company, 200)) return Response.json({ ok: true });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) {
    return Response.json({ error: "Za dużo prób. Spróbuj za kilka minut." }, { status: 429 });
  }

  const data = validate(body);
  if (typeof data === "string") return Response.json({ error: data }, { status: 400 });

  // zapis w panelu (Zapytania) — działa nawet bez skonfigurowanego maila
  let saved = false;
  try {
    await run("INSERT INTO inquiries (id, name, email, phone, company, topic, budget, timeline, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
      id(),
      data.name,
      data.email,
      data.phone,
      data.firm || null,
      data.topic || null,
      data.budget || null,
      data.timeline || null,
      data.message,
      Date.now(),
    ]);
    saved = true;
  } catch (e) {
    console.error("[contact] zapis w bazie", e);
  }

  const results = await Promise.allSettled([sendResend(data), sendDiscord(data)]);
  const delivered = saved || results.some((r) => r.status === "fulfilled" && r.value === true);
  results.forEach((r) => r.status === "rejected" && console.error("[contact]", r.reason));
  const failed = results.filter((r) => r.status === "rejected").map((r) => String((r as PromiseRejectedResult).reason?.message ?? r));
  await log("inquiry", `Nowe zapytanie: ${data.name}${data.topic ? ` · ${data.topic}` : ""}`, { level: failed.length ? "warn" : "success", actor: data.email, ip, meta: failed.length ? { failed } : undefined });

  if (!delivered) {
    return Response.json({ error: "Nie udało się wysłać wiadomości." }, { status: 502 });
  }
  return Response.json({ ok: true });
}
