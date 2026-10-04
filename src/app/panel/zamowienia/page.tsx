import type { Metadata } from "next";
import { plural } from "@/lib/format";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth/session";
import { clientOrders, clientRequests, REQUEST_STATUS } from "@/lib/client";
import { today } from "@/lib/orders";
import { Badge, Card, CardHead, Empty, PageHead } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import { OfferCard, OrderCard } from "@/components/panel/client/Orders";
import { clientOffers } from "@/lib/offers";
import { paymentsForUser } from "@/lib/finance";

export const metadata: Metadata = { title: "Moje zamówienia" };

const fmtDay = (d: string) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" }).format(new Date(`${d}T12:00:00`));
const fmt = (ms: number) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Warsaw" }).format(ms);

export default async function OrdersPage() {
  const user = await requireUser();
  if (isAdmin(user)) redirect("/panel/admin");
  // najpierw dociągnij wpłaty ze Stripe — opłacona wycena od razu staje się zleceniem
  await paymentsForUser(user.id, user.email);
  const [orders, requests, offers] = await Promise.all([clientOrders(user.id, user.email), clientRequests(user.id, user.email), clientOffers(user.id, user.email)]);
  const t = today();
  const active = orders.filter((o) => o.status !== "done");
  const finished = orders.filter((o) => o.status === "done");

  return (
    <>
      <PageHead title="Moje zamówienia" text="Wyceny do opłacenia, zlecenia w realizacji z terminami i status Twoich zgłoszeń." />

      {offers.length > 0 && (
        <div className="mb-4 space-y-4 lg:mb-5">
          {offers.map((o) => (
            <OfferCard key={o.id} o={o} today={t} />
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:gap-5">
        <div className="space-y-4 lg:space-y-5">
          <Card>
            <CardHead title="W realizacji" sub={active.length ? `${active.length} ${plural(active.length, "zlecenie", "zlecenia", "zleceń")}` : undefined} />
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
                    {r.status !== "lost" && (
                      <ol className="mt-4 grid grid-cols-3 gap-1.5">
                        {["Wysłane", "W toku", r.order_due ? `Termin ${fmtDay(r.order_due)}` : "Przyjęte"].map((label, i) => {
                          const step = { new: 0, contacted: 1, won: 2 }[r.status as "new"] ?? 0;
                          return (
                            <li key={label}>
                              <span className={`block h-1 rounded-full ${i <= step ? (step === 2 ? "bg-emerald-400" : "bg-gradient-to-r from-accent to-accent-2") : "bg-white/[0.07]"}`} />
                              <span className={`mt-1.5 block truncate text-[11.5px] ${i <= step ? "text-ink/85" : "text-dim"}`}>{label}</span>
                            </li>
                          );
                        })}
                      </ol>
                    )}
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
