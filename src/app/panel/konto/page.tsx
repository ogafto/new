import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth/session";
import { PageHead } from "@/components/panel/kit";
import AccountForms from "@/components/panel/client/AccountForms";

export const metadata: Metadata = { title: "Konto" };

export default async function AccountPage() {
  const user = await requireUser();
  if (isAdmin(user)) redirect("/panel/admin");
  return (
    <>
      <PageHead kicker="Konto" title="Twoje konto" />
      <AccountForms name={user.name} phone={user.phone ?? ""} email={user.email} since={Number(user.created_at)} />
    </>
  );
}
