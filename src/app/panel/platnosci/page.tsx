import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth/session";
import { all } from "@/lib/db";
import { zl, type Payment } from "@/lib/finance";
import { Badge, Card, CardHead, Empty, Icon, PageHead } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";

export const metadata: Metadata = { title: "Płatności" };

const fmt = (ms: number) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Warsaw" }).format(ms);
const fmtDay = (d: string) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" }).format(new Date(`${d}T12:00:00`));

export default async function PaymentsPage() {
  const user = await requireUser();
  if (isAdmin(user)) redirect("/panel/admin");
  const payments = await all<Payment>("SELECT * FROM payments WHERE (user_id = ? OR lower(client_email) = lower(?)) AND status IN ('pending', 'paid', 'refunded') ORDER BY created_at DESC LIMIT 100", [user.id, user.email]);
  const due = payments.filter((p) => p.status === "pending");
  const history = payments.filter((p) => p.status !== "pending");
  const paidSum = history.filter((p) => p.status === "paid").reduce((a, p) => a + Number(p.amount), 0);
  const dueSum = due.reduce((a, p) => a + Number(p.amount), 0);

  return (
    <>
      <PageHead kicker="Płatności" title="Płatności" />
      <div className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-[24px] border border-line bg-line sm:grid-cols-3">
        {[
          ["Do zapłaty", zl(dueSum), dueSum ? "text-amber-100" : ""],
          ["Zapłacono łącznie", zl(paidSum), ""],
          ["Płatności", String(payments.length), ""],
        ].map(([l, v, c]) => (
          <div key={l} className="bg-bg/80 p-5 sm:p-6">
            <p className="text-[12.5px] text-dim">{l}</p>
            <p className={`h-display mt-2 text-[30px] leading-none sm:text-[36px] ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr] lg:gap-5">
        <Card glow={due.length > 0}>
          <CardHead title="Do zapłaty" sub={due.length ? `${due.length} ${due.length === 1 ? "płatność" : "płatności"} do opłacenia` : undefined} />
          {due.length ? (
            <ul className="space-y-3">
              {due.map((p) => (
                <li key={p.id} className="rounded-2xl border border-accent/25 bg-accent/[0.05] p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[15px] leading-snug">{p.title}</p>
                      {p.due_date && <p className="mt-0.5 text-[12.5px] text-dim">Termin: {fmtDay(p.due_date)}</p>}
                    </div>
                    <p className="h-display shrink-0 text-[24px] leading-none">{zl(Number(p.amount))}</p>
                  </div>
                  {p.stripe_url ? (
                    <a href={p.stripe_url} target="_blank" rel="noopener noreferrer" className="group btn btn-primary mt-4 !h-11 w-full justify-between text-[14px]">
                      <span className="roll">
                        <span>Zapłać online</span>
                        <span aria-hidden>Zapłać online</span>
                      </span>
                      <span className="dot !size-8">
                        <Icon d={ICONS.card} className="size-4" />
                      </span>
                    </a>
                  ) : (
                    <p className="mt-3 text-[12.5px] text-muted">Płatność przelewem — szczegóły w mailu.</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon={ICONS.check} title="Nic do zapłaty" />
          )}
        </Card>

        <Card delay={0.06}>
          <CardHead title="Historia" />
          {history.length ? (
            <ul className="divide-y divide-line">
              {history.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${p.status === "paid" ? "bg-emerald-400/10 text-emerald-300" : "bg-white/[0.05] text-muted"}`}>
                    <Icon d={p.status === "paid" ? ICONS.check : ICONS.refresh} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px]">{p.title}</span>
                    <span className="block text-[12.5px] text-dim">{p.paid_at ? fmt(Number(p.paid_at)) : fmt(Number(p.created_at))}</span>
                  </span>
                  {p.status === "refunded" && <Badge tone="amber">Zwrot</Badge>}
                  <span className="text-[14.5px] tabular-nums">{zl(Number(p.amount))}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon={ICONS.receipt} title="Brak historii" />
          )}
        </Card>
      </div>
    </>
  );
}
