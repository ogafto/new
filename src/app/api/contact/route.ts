import { Resend } from "resend";
import { site } from "@/lib/site";

type Payload = {
  name: string;
  email: string;
  phone: string;
  topic: string;
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
    topic: str(body.topic, 300),
    message: str(body.message, 3000),
  };
  if (data.name.length < 2) return "Podaj imię.";
  if (!EMAIL_RE.test(data.email)) return "Podaj poprawny adres e-mail.";
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
        ${row("Imię", d.name)}${row("E-mail", d.email)}${row("Telefon", d.phone)}${row("Konfiguracja", d.topic)}
      </table>
      <div style="margin-top:12px;padding:16px;background:#f4f4f5;border-radius:12px;color:#111;font-size:15px;line-height:1.6;white-space:pre-wrap">${escapeHtml(d.message)}</div>
      <p style="color:#8b8b94;font-size:12px;margin-top:20px">Kliknij „Odpowiedz”, aby napisać bezpośrednio do klienta.</p>
    </div>
  </div></body></html>`;
}

async function sendResend(d: Payload) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: process.env.CONTACT_FROM || `${site.domain} <formularz@${site.domain}>`,
    to: process.env.CONTACT_TO || site.email,
    replyTo: d.email,
    subject: `Nowe zapytanie — ${d.name}`,
    html: emailHtml(d),
    text: `Imię: ${d.name}\nE-mail: ${d.email}\nTelefon: ${d.phone || "—"}\nKonfiguracja: ${d.topic || "—"}\n\n${d.message}`,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
  return true;
}

async function sendDiscord(d: Payload) {
  const url = process.env.DISCORD_WEBHOOK_URL;
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
          title: `💬 Nowy komentarz — ${d.name}`,
          color: 0x0d99ff,
          fields: [
            { name: "Imię", value: d.name, inline: true },
            { name: "E-mail", value: d.email, inline: true },
            { name: "Telefon", value: d.phone || "—", inline: true },
            ...(d.topic ? [{ name: "Konfiguracja", value: d.topic.slice(0, 1024) }] : []),
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

  const results = await Promise.allSettled([sendResend(data), sendDiscord(data)]);
  const delivered = results.some((r) => r.status === "fulfilled" && r.value === true);
  const configured = results.some((r) => r.status === "rejected" || r.value !== null);

  results.forEach((r) => r.status === "rejected" && console.error("[contact]", r.reason));

  if (!configured) {
    console.error("[contact] Brak RESEND_API_KEY i DISCORD_WEBHOOK_URL — formularz nie jest skonfigurowany.");
    return Response.json({ error: "Formularz jest chwilowo niedostępny." }, { status: 503 });
  }
  if (!delivered) {
    return Response.json({ error: "Nie udało się wysłać wiadomości." }, { status: 502 });
  }
  return Response.json({ ok: true });
}
