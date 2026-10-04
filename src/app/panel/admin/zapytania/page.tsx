import type { Metadata } from "next";
import { all } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { Badge, PageHead } from "@/components/panel/kit";
import Inquiries, { type Inquiry } from "@/components/panel/Inquiries";

export const metadata: Metadata = { title: "Zapytania" };

async function load() {
  const rows = await all<Inquiry>(
    `SELECT i.*, o.due_date AS order_due, o.title AS order_title,
      f.id AS offer_id, f.status AS offer_status, f.amount AS offer_amount, f.deposit AS offer_deposit, f.pay_by AS offer_pay_by, f.work_days AS offer_days,
      (SELECT stripe_url FROM payments WHERE offer_id = f.id AND kind = 'full' AND status = 'pending') AS offer_full_url,
      (SELECT stripe_url FROM payments WHERE offer_id = f.id AND kind = 'deposit' AND status = 'pending') AS offer_dep_url
    FROM inquiries i
    LEFT JOIN orders o ON o.id = i.order_id
    LEFT JOIN offers f ON f.id = (SELECT id FROM offers WHERE inquiry_id = i.id AND status != 'cancelled' ORDER BY created_at DESC LIMIT 1)
    ORDER BY i.created_at DESC LIMIT 300`,
  );
  return { rows, now: Date.now() };
}

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<{ id?: string; przyjmij?: string }> }) {
  await requireAdmin();
  const [{ rows, now }, sp] = await Promise.all([load(), searchParams]);
  const fresh = rows.filter((r) => r.status === "new").length;
  return (
    <>
      <PageHead title="Zapytania" text="Zapytania ze strony i zamówienia z panelu klientów — zajmij się, przyjmij z terminem albo odrzuć.">
        {fresh > 0 && (
          <Badge tone="accent">
            <span className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_rgb(139_108_255/0.9)]" />
            {fresh} {fresh === 1 || (fresh % 10 >= 2 && fresh % 10 <= 4 && (fresh % 100 < 12 || fresh % 100 > 14)) ? "nowe" : "nowych"}
          </Badge>
        )}
      </PageHead>
      <Inquiries key={sp.id ?? "all"} rows={rows.map((r) => ({ ...r, created_at: Number(r.created_at) }))} now={now} focus={sp.id} accept={sp.przyjmij === "1"} />
    </>
  );
}
