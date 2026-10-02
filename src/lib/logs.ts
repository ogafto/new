import { all, one, run } from "./db";
import { id } from "./auth/crypto";

/*
 * Dziennik zdarzeń panelu: logowania, zmiany ustawień, płatności, zapytania, błędy wysyłki.
 * Zapis nigdy nie przerywa głównej akcji (błędy bazy są połykane). Wpisy starsze niż 90 dni znikają same.
 */

export type LogLevel = "info" | "success" | "warn" | "error";
export type LogKind = "auth" | "settings" | "payment" | "inquiry" | "content" | "client" | "mail" | "system";

export type LogRow = { id: string; ts: number; level: LogLevel; kind: LogKind; message: string; meta: string | null; actor: string | null; ip: string | null };

export const KINDS: Record<LogKind, string> = {
  auth: "Logowanie",
  settings: "Ustawienia",
  payment: "Płatności",
  inquiry: "Zapytania",
  content: "Treści",
  client: "Klienci",
  mail: "E-mail",
  system: "System",
};

const KEEP = 90 * 86_400_000;

export async function log(kind: LogKind, message: string, opts: { level?: LogLevel; meta?: Record<string, unknown>; actor?: string | null; ip?: string | null } = {}) {
  try {
    await run("INSERT INTO logs (id, ts, level, kind, message, meta, actor, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
      id(),
      Date.now(),
      opts.level ?? "info",
      kind,
      message.slice(0, 500),
      opts.meta ? JSON.stringify(opts.meta).slice(0, 4000) : null,
      opts.actor ?? null,
      opts.ip ?? null,
    ]);
    // sprzątanie raz na jakiś czas
    if (Math.random() < 0.02) await run("DELETE FROM logs WHERE ts < ?", [Date.now() - KEEP]);
  } catch {}
}

export async function listLogs({ kind, level, q, before, limit = 60 }: { kind?: string; level?: string; q?: string; before?: number; limit?: number }) {
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (kind && kind in KINDS) {
    where.push("kind = ?");
    args.push(kind);
  }
  if (level && ["info", "success", "warn", "error"].includes(level)) {
    where.push("level = ?");
    args.push(level);
  }
  if (q) {
    where.push("(message LIKE ? OR actor LIKE ? OR meta LIKE ?)");
    const like = `%${q.slice(0, 80)}%`;
    args.push(like, like, like);
  }
  if (before) {
    where.push("ts < ?");
    args.push(before);
  }
  const cond = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return all<LogRow>(`SELECT * FROM logs ${cond} ORDER BY ts DESC LIMIT ${Math.min(200, limit)}`, args);
}

export async function logStats() {
  const day = Date.now() - 86_400_000;
  const r = await one<{ total: number; errors: number; warns: number; logins: number }>(
    "SELECT COUNT(*) total, SUM(CASE WHEN level = 'error' THEN 1 ELSE 0 END) errors, SUM(CASE WHEN level = 'warn' THEN 1 ELSE 0 END) warns, SUM(CASE WHEN kind = 'auth' AND level = 'success' THEN 1 ELSE 0 END) logins FROM logs WHERE ts > ?",
    [day],
  );
  return { total: Number(r?.total ?? 0), errors: Number(r?.errors ?? 0), warns: Number(r?.warns ?? 0), logins: Number(r?.logins ?? 0) };
}
