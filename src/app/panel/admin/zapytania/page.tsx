import type { Metadata } from "next";
import { all } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { PageHead } from "@/components/panel/kit";
import Inquiries, { type Inquiry } from "@/components/panel/Inquiries";

export const metadata: Metadata = { title: "Zapytania" };

export default async function InquiriesPage() {
  await requireAdmin();
  const rows = await all<Inquiry>("SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 300");
  return (
    <>
      <PageHead kicker="Zapytania" title="Wiadomości z formularza" />
      <Inquiries rows={rows.map((r) => ({ ...r, created_at: Number(r.created_at) }))} />
    </>
  );
}
