import { createElement } from "react";
import { render } from "@react-email/render";
import InviteEmail from "@/emails/InviteEmail";
import VerifyEmail from "@/emails/VerifyEmail";
import { currentUser } from "@/lib/auth/session";

// Podgląd szablonów maili (tylko administrator)
export async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const user = await currentUser();
  if (user?.role !== "admin" || !user.verified_at) return new Response("Brak dostępu", { status: 403 });
  const { type } = await params;
  const baseUrl = new URL(req.url).origin;
  const el =
    type === "zaproszenie"
      ? createElement(InviteEmail, { email: "klient@firma.pl", name: "Anna", code: "K7QF-M2XP", baseUrl, days: 7 })
      : type === "weryfikacja"
        ? createElement(VerifyEmail, { name: "Anna Nowak", code: "482917", baseUrl, minutes: 15 })
        : null;
  if (!el) return new Response("Nie znaleziono", { status: 404 });
  return new Response(await render(el), { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
