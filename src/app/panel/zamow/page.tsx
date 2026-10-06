import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth/session";
import { loadContent } from "@/lib/content-server";
import { services } from "@/lib/site";
import { PageHead } from "@/components/panel/kit";
import OrderForm from "@/components/panel/client/OrderForm";

export const metadata: Metadata = { title: "Zamów usługę" };

export default async function OrderPage() {
  await loadContent();
  const user = await requireUser();
  if (isAdmin(user)) redirect("/panel/admin");
  return (
    <>
      <PageHead kicker="Zamówienia" title="Zamów usługę" text="Wybierz, czego potrzebujesz — odezwę się z pytaniami i wyceną." />
      <OrderForm services={services.map((s) => ({ id: s.id, name: s.name, price: s.price, time: s.time, description: s.description, icon: s.icon }))} />
    </>
  );
}
