"use server";

import { requireAdmin } from "@/lib/auth/session";
import { sessionJourney } from "@/lib/analytics";

export async function journey(session: string) {
  await requireAdmin();
  return sessionJourney(session);
}
