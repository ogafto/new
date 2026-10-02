import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { currentUser, isAdmin } from "@/lib/auth/session";
import LoginForm from "@/components/account/LoginForm";

export const metadata: Metadata = { title: "Logowanie" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await currentUser();
  const home = user?.verified_at ? (isAdmin(user) ? "/panel/admin" : "/panel") : undefined;
  // Po zalogowaniu Next odświeża tę stronę w ramach akcji (ustawione ciasteczko).
  // Redirect w tym momencie wyrzucał formularz i zostawała pusta karta — wtedy formularz sam przechodzi do panelu.
  if (home && !(await headers()).has("next-action")) redirect(home);
  const { next } = await searchParams;
  return <LoginForm next={next ?? ""} signedIn={home} />;
}
