import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser, isAdmin } from "@/lib/auth/session";
import LoginForm from "@/components/account/LoginForm";

export const metadata: Metadata = { title: "Logowanie" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await currentUser();
  if (user?.verified_at) redirect(isAdmin(user) ? "/panel/admin" : "/panel");
  const { next } = await searchParams;
  return <LoginForm next={next ?? ""} />;
}
