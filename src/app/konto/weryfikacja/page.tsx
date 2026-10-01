import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import VerifyForm from "@/components/account/VerifyForm";

export const metadata: Metadata = { title: "Weryfikacja e-maila" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ blad?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/konto/logowanie");
  if (user.verified_at) redirect(user.role === "admin" ? "/panel/admin" : "/panel");
  const { blad } = await searchParams;
  return <VerifyForm email={user.email} sendFailed={blad === "wysylka"} />;
}
