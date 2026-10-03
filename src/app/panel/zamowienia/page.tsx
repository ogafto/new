import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth/session";
import { clientOrders, clientRequests, REQUEST_STATUS } from "@/lib/client";
import { today } from "@/lib/orders";
import { Badge, Card, CardHead, Empty, Icon, PageHead } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import { OrderCard } from "@/components/panel/client/Orders";

export const metadata: Metadata = { title: "Moje zamówienia" };

const fmt = (ms: number) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Warsaw" }).format(ms);

export default async function OrdersPage() {
  const user = await requireUser();
  if (isAdmin(user)) redirect("/panel/admin");
  const [orders, requests] = await Promise.all([clientOrders(user.id, user.email), clientRequests(user.id, user.email)]);
  const t = today();
  const active = orders.filter((o) => o.status !== "done");
  const finished = orders.filter((o) => o.status === "done");

  return (
    <>
      <PageHead kicker="Zamówienia" title="Moje zamówienia">
        <Link href="/panel/zamow" className="group btn btn-primary !h-11 text-[14px]">
          <span className="roll">
            <span>Zamów usługę</span>
            <span aria-hidden>Zamów usługę</span>
          </span>
          <span className="dot !size-8">
            <Icon d={ICONS.plus} className="size-4" />
          </span>
        </Link>
      </PageHead>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:gap-5">
        <div className="space-y-4 lg:space-y-5">
          <Card>
            <CardHead title="W realizacji" sub={active.length ? `${active.length} ${active.length === 1 ? "zlecenie" : "zlecenia"}` : undefined} />
            {active.length ? (
              <div className="space-y-3">
                {active.map((o) => (
                  <OrderCard key={o.id} o={o} today={t} />
                ))}
              </div>
            ) : (
              <Empty icon={ICONS.layers} title="Nic w realizacji" text="Przyjęte zamówienia pojawią się tutaj z terminem i postępem." />
            )}
          </Card>
          {finished.length > 0 && (
            <Card delay={0.05}>
              <CardHead title="Oddane" sub={`${finished.length}`} />
              <div className="space-y-3">
                {finished.map((o) => (
                  <OrderCard key={o.id} o={o} today={t} />
                ))}
              </div>
            </Card>
          )}
        </div>

        <Card delay={0.08}>
          <CardHead title="Zgłoszenia" sub="Wysłane zamówienia i zapytania" />
          {requests.length ? (
            <ul className="space-y-2.5">
              {requests.map((r) => {
                const st = REQUEST_STATUS[r.status] ?? REQUEST_STATUS.new;
                return (
                  <li key={r.id} className="rounded-2xl border border-line p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-[14.5px] leading-snug">{r.topic || "Zapytanie"}</p>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </div>
                    <p className="mt-1 text-[12.5px] text-dim">
                      {fmt(r.created_at)}
                      {r.budget ? ` · ${r.budget}` : ""}
                      {r.timeline ? ` · ${r.timeline}` : ""}
                    </p>
                    <p className="mt-2.5 line-clamp-3 text-[13.5px] leading-relaxed text-muted">{r.message}</p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty icon={ICONS.inbox} title="Brak zgłoszeń" text="Zamów usługę — odezwę się z pytaniami i wyceną.">
              <Link href="/panel/zamow" className="btn btn-outline !h-10 text-[13.5px]">
                Zamów usługę
              </Link>
            </Empty>
          )}
        </Card>
      </div>
    </>
  );
}
