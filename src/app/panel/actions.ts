"use server";

import { cookies } from "next/headers";
import { currentUser, isAdmin, ROLE_COOKIE, setRoleCookie } from "@/lib/auth/session";

// Dla sesji sprzed wprowadzenia podpowiedzi roli — ustawia ją raz (proxy kieruje wtedy prosto do panelu)
export async function syncRole() {
  const user = await currentUser();
  if (!user?.verified_at) return;
  const role = isAdmin(user) ? "admin" : "client";
  if ((await cookies()).get(ROLE_COOKIE)?.value !== role) await setRoleCookie(role);
}
