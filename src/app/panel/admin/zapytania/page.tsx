import type { Metadata } from "next";
import { all } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { Badge, PageHead } from "@/components/panel/kit";
import Inquiries, { type Inquiry } from "@/components/panel/Inquiries";

export const metadata: Metadata = { title: "Zapytania" };

async function load() {
  const rows = await all<Inquiry>("SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 300");
  return { rows, now: Date.now() };
}

export default async function InquiriesPage() {
  await requireAdmin();
  const { rows, now } = await load();
  const fresh = rows.filter((r) => r.status === "new").length;
  return (
    <>
      <PageHead kicker="Klienci" title="Zapytania">
        {fresh > 0 && (
          <Badge tone="accent">
            <span className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_rgb(139_108_255/0.9)]" />
            {fresh} {fresh === 1 || (fresh % 10 >= 2 && fresh % 10 <= 4 && (fresh % 100 < 12 || fresh % 100 > 14)) ? "nowe" : "nowych"}
          </Badge>
        )}
      </PageHead>
      <Inquiries rows={rows.map((r) => ({ ...r, created_at: Number(r.created_at) }))} now={now} />
    </>
  );
}
