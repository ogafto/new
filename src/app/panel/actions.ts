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

// Podgląd pełnej strony w trybie zapowiedzi — tylko dla admina (ciasteczko sprawdzane w proxy razem z sesją)
export async function setSitePreview(on: boolean) {
  const user = await currentUser();
  if (!user || !isAdmin(user)) return;
  const jar = await cookies();
  if (on) jar.set("afto_preview", "1", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  else jar.delete("afto_preview");
}
