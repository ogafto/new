import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser, isAdmin } from "@/lib/auth/session";
import RegisterForm from "@/components/account/RegisterForm";

export const metadata: Metadata = { title: "Załóż konto" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ kod?: string; email?: string }> }) {
  const user = await currentUser();
  if (user?.verified_at) redirect(isAdmin(user) ? "/panel/admin" : "/panel");
  const { kod, email } = await searchParams;
  return <RegisterForm code={kod ?? ""} email={email ?? ""} />;
}
