import { housekeeping, sendReminders } from "@/lib/orders";

// Wywoływane raz dziennie (Vercel Cron albo dowolny zewnętrzny cron) z nagłówkiem Authorization: Bearer CRON_SECRET
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Brak dostępu", { status: 401 });
  await housekeeping();
  return Response.json(await sendReminders());
}
