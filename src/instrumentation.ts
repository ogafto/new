// Na własnym serwerze (np. VPS) przypomnienia z kalendarza sprawdzają się same co godzinę.
// Na Vercelu robi to Vercel Cron (vercel.json → /api/cron/reminders).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.VERCEL || process.env.NODE_ENV !== "production") return;
  const { sendReminders } = await import("./lib/orders");
  const tick = () => sendReminders().catch((e) => console.error("[przypomnienia]", e));
  setTimeout(tick, 60_000);
  setInterval(tick, 60 * 60_000);
}
