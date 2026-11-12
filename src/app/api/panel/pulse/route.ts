import { NextResponse } from "next/server";
import { currentUser, isAdmin } from "@/lib/auth/session";
import { live } from "@/lib/analytics";

// Licznik „na stronie” w panelu admina (osoby w ostatnich 5 minutach)
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user || !user.verified_at || !isAdmin(user)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ live: await live() }, { headers: { "Cache-Control": "no-store" } });
}
