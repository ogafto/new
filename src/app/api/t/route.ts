import { cookies } from "next/headers";
import { one, run } from "@/lib/db";
import { id, sha256 } from "@/lib/auth/crypto";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import { isBot, parseUA } from "@/lib/ua";
import { setting } from "@/lib/settings";

/*
 * Analityka bez ciasteczek. Odwiedzający = skrót (dobowa sól + IP + przeglądarka) — nie da się go
 * powiązać z osobą ani śledzić między dniami. Sesja = wizyty tego samego skrótu w odstępach < 30 min.
 */

const SESSION_GAP = 30 * 60_000;
const s = (v: unknown, max = 300) => (typeof v === "string" ? v.slice(0, max) : null);
const n = (v: unknown, max: number) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.round(v))) : 0);

async function isAdminVisit() {
  const t = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!t) return false;
  const u = await one<{ email: string; role: string }>("SELECT u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?", [sha256(t)]);
  return !!u && u.role === "admin" && isAdminEmail(u.email);
}

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = JSON.parse(await req.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  const ua = req.headers.get("user-agent") || "";
  if (isBot(ua)) return new Response(null, { status: 204 });
  const pv = s(b.id, 64);
  if (!pv) return new Response(null, { status: 400 });
  const now = Date.now();

  if (b.t === "pv") {
    if (await isAdminVisit()) return new Response(null, { status: 204 });
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "0";
    const day = new Date().toISOString().slice(0, 10);
    const visitor = sha256(`${(await setting("analytics_salt")) || process.env.DATABASE_URL || "afto"}:${day}:${ip}:${ua}`).slice(0, 24);
    const last = await one<{ session: string }>("SELECT session FROM pageviews WHERE visitor = ? AND COALESCE(seen, ts) > ? ORDER BY ts DESC LIMIT 1", [visitor, now - SESSION_GAP]);
    const ref = s(b.ref, 500);
    let host: string | null = null;
    try {
      host = ref ? new URL(ref).hostname.replace(/^www\./, "") : null;
    } catch {}
    const self = new URL(req.url).hostname.replace(/^www\./, "");
    if (host === self) host = null;
    const { device, browser, os } = parseUA(ua);
    const country = req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || null;
    await run(
      `INSERT OR IGNORE INTO pageviews (id, visitor, session, path, referrer, ref_host, utm_source, utm_medium, utm_campaign, device, browser, os, country, lang, screen, ts, seen)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pv, visitor, last?.session ?? id(), s(b.path, 300) || "/", host ? ref : null, host, s(b.us, 80), s(b.um, 80), s(b.uc, 120), device, browser, os, country, s(b.lang, 12), n(b.w, 10000), now, now],
    );
    return new Response(null, { status: 204 });
  }

  if (b.t === "ping") {
    await run("UPDATE pageviews SET duration = MAX(duration, ?), scroll = MAX(scroll, ?), section = COALESCE(?, section), seen = ? WHERE id = ?", [
      n(b.d, 6 * 3600_000),
      n(b.s, 100),
      s(b.sec, 40),
      now,
      pv,
    ]);
    return new Response(null, { status: 204 });
  }

  if (b.t === "ev") {
    const row = await one<{ session: string; visitor: string; path: string }>("SELECT session, visitor, path FROM pageviews WHERE id = ?", [pv]);
    if (!row) return new Response(null, { status: 204 });
    await run("INSERT INTO events (pv, session, visitor, type, label, value, path, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
      pv,
      row.session,
      row.visitor,
      s(b.type, 20) || "click",
      s(b.label, 120),
      s(b.value, 300),
      row.path,
      now,
    ]);
    await run("UPDATE pageviews SET seen = ? WHERE id = ?", [now, pv]);
    return new Response(null, { status: 204 });
  }

  return new Response(null, { status: 400 });
}
