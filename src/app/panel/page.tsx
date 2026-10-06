import Link from "next/link";
import { plural } from "@/lib/format";
import { redirect } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth/session";
import { clientOrders, clientRequests } from "@/lib/client";
import { loadContent } from "@/lib/content-server";
import { paymentsForUser, zl } from "@/lib/finance";
import { daysBetween, today } from "@/lib/orders";
import { site, steps } from "@/lib/site";
import { Badge, Empty, Icon, PageHead } from "@/components/panel/kit";
import { Metric, Panel, Row } from "@/components/panel/dash";
import { ICONS } from "@/components/panel/icons";
import ProjectProgress from "@/components/panel/ProjectProgress";
import { OfferCard, OrderCard } from "@/components/panel/client/Orders";
import { clientOffers } from "@/lib/offers";

const DISCORD = "M8.5 15.5c-.6.9-1.5 1.8-1.5 1.8-2.6-.1-3.5-1.8-3.5-1.8 0-3.8 1.7-6.9 1.7-6.9 1.7-1.3 3.3-1.2 3.3-1.2l.2.3M15.5 15.5c.6.9 1.5 1.8 1.5 1.8 2.6-.1 3.5-1.8 3.5-1.8 0-3.8-1.7-6.9-1.7-6.9-1.7-1.3-3.3-1.2-3.3-1.2l-.2.3M7.5 8.5a12 12 0 019 0M7.5 16a12 12 0 009 0M9.5 13h.01M14.5 13h.01";
const longDate = (d: string) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" }).format(new Date(`${d}T12:00:00`));

export default async function ClientPanel({ searchParams }: { searchParams: Promise<{ witaj?: string }> }) {
  await loadContent();
  const user = await requireUser();
  if (isAdmin(user)) redirect("/panel/admin");
  // płatności najpierw (synchronizacja ze Stripe może uruchomić zlecenie z opłaconej wyceny)
  const payments = await paymentsForUser(user.id, user.email);
  const [{ witaj }, orders, requests, offers] = await Promise.all([searchParams, clientOrders(user.id, user.email), clientRequests(user.id, user.email), clientOffers(user.id, user.email)]);
  const t = today();
  const first = user.name.split(" ")[0];
  const stage = Number(user.stage);
  const hasProject = !!user.project;
  const done = stage >= steps.length;
  const active = orders.filter((o) => o.status !== "done");
  const nextDue = active.slice().sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
  const due = payments.filter((p) => p.status === "pending");
  const dueSum = due.reduce((a, p) => a + Number(p.amount), 0);
  const openRequests = requests.filter((r) => r.status === "new" || r.status === "contacted");

  const accent = hasProject ? (done ? "Strona jest online." : `Etap: ${steps[stage]?.title ?? ""}.`) : active.length ? "Pracujemy nad tym." : openRequests.length ? "Zamówienie wysłane." : "Co dziś tworzymy?";
  const summary =
    [
      nextDue ? `Najbliższy termin: ${longDate(nextDue.due_date)}` : null,
      dueSum ? `do zapłaty ${zl(dueSum)}` : null,
      openRequests.length ? `${openRequests.length} ${plural(openRequests.length, "zgłoszenie czeka", "zgłoszenia czekają", "zgłoszeń czeka")} na odpowiedź` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Zamów stronę, sklep, identyfikację albo projekt UI. Wszystko ogarniesz tutaj";

  const contact = [
    { label: "E-mail", value: site.email, href: `mailto:${site.email}`, icon: ICONS.mail },
    { label: "Telefon", value: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}`, icon: ICONS.phone },
    { label: "Discord", value: "Napisz na Discordzie", href: site.socials.find((s) => s.label === "Discord")?.href ?? "#", icon: DISCORD, external: true },
  ];

  const prog = (o: { start_date: string; due_date: string }) => Math.max(0.04, Math.min(1, daysBetween(o.start_date, t) / Math.max(1, daysBetween(o.start_date, o.due_date))));
  const left = nextDue ? daysBetween(t, nextDue.due_date) : 0;
  const paidSum = payments.filter((p) => p.status === "paid").reduce((a, p) => a + Number(p.amount), 0);
  const paidShare = paidSum + dueSum ? paidSum / (paidSum + dueSum) : 1;

  return (
    <>
      <PageHead title="Kokpit" text={`${witaj ? "Witaj w afto" : "Cześć"}, ${first}. ${accent} ${summary}.`} />

      {offers.length > 0 && (
        <div className="mb-4 space-y-4">
          {offers.map((o) => (
            <OfferCard key={o.id} o={o} today={t} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Metric i={0} label="Zlecenia w toku" value={active.length} viz={{ kind: "lollipop", data: active.length ? active.map(prog) : [0.08, 0.08, 0.08] }} foot={active.length ? "postęp każdego zlecenia" : "brak aktywnych zleceń"} href="/panel/zamowienia" />
        <Metric
          i={1}
          label="Najbliższy termin"
          value={Math.max(0, left)}
          suffix={left === 1 ? " dzień" : " dni"}
          viz={nextDue ? { kind: "gauge", value: prog(nextDue), label: longDate(nextDue.due_date) } : undefined}
          icon={nextDue ? undefined : ICONS.calendar}
          foot={nextDue ? nextDue.title : "Termin pojawi się po przyjęciu zamówienia"}
          href="/panel/zamowienia"
        />
        <Metric i={2} label="Do zapłaty" value={Math.round(dueSum / 100)} suffix=" zł" viz={{ kind: "gauge", value: paidShare, label: `opłacono ${Math.round(paidShare * 100)}%` }} foot={due.length ? `${due.length} ${due.length === 1 ? "płatność" : "płatności"} do opłacenia` : "Wszystko opłacone"} href="/panel/platnosci" />
        <Metric i={3} label="Zgłoszenia" value={requests.length} viz={{ kind: "bars", data: requests.length ? requests.slice(0, 12).reverse().map((r) => ({ new: 1, contacted: 2, won: 3, lost: 0.5 })[r.status as "new"] ?? 1) : [0, 0, 0, 0, 0, 0] }} foot={openRequests.length ? `${openRequests.length} w toku` : "Zamów usługę w minutę"} href="/panel/zamowienia" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {hasProject ? (
            <Panel title={user.project ?? "Twój projekt"} action={<Badge tone={done ? "green" : "accent"}>{done ? "Gotowe" : `Etap ${stage + 1} z ${steps.length}`}</Badge>}>
              <p className="-mt-2 mb-4 text-[13.5px] text-muted">{done ? "Projekt opublikowany" : `${steps[stage]?.title ?? ""} · ${steps[stage]?.lead ?? ""}`}</p>
              <ProjectProgress stage={stage} />
            </Panel>
          ) : (
            <Panel
              title="Zlecenia w toku"
              action={
                <Link href="/panel/zamowienia" className="text-[13px] text-muted hover:text-ink">
                  Wszystkie →
                </Link>
              }
            >
              {active.length ? (
                <div className="space-y-3">
                  {active.slice(0, 3).map((o) => (
                    <OrderCard key={o.id} o={o} today={t} compact />
                  ))}
                </div>
              ) : (
                <Empty icon={ICONS.layers} title="Brak aktywnych zleceń" text="Gdy przyjmę Twoje zamówienie, zobaczysz tu postęp i termin.">
                  <Link href="/panel/zamow" className="btn btn-outline !h-10 text-[13.5px]">
                    Zamów usługę
                  </Link>
                </Empty>
              )}
            </Panel>
          )}
        </div>
        <div className="lg:col-span-4">
          <Panel
            i={1}
            title="Płatności"
            action={
              <Link href="/panel/platnosci" className="text-[13px] text-muted hover:text-ink">
                Historia →
              </Link>
            }
          >
            {due.length ? (
              <div className="space-y-2.5">
                {due.slice(0, 3).map((p) => (
                  <div key={p.id} className="rounded-2xl bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-[14px] leading-snug">{p.title}</p>
                      <p className="shrink-0 text-[16px] tabular-nums">{zl(Number(p.amount))}</p>
                    </div>
                    {p.stripe_url && (
                      <a href={p.stripe_url} target="_blank" rel="noopener noreferrer" className="mt-3 flex h-10 items-center justify-center gap-2 rounded-full bg-ink text-[13.5px] font-medium text-bg transition-colors hover:bg-white">
                        <Icon d={ICONS.card} className="size-4" /> Zapłać online
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-[14px] text-emerald-200">
                <Icon d={ICONS.check} className="size-4" /> Nic do zapłaty
              </p>
            )}
          </Panel>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {hasProject && (
          <div className="lg:col-span-8">
            <Panel
              i={2}
              title="Zlecenia w toku"
              action={
                <Link href="/panel/zamowienia" className="text-[13px] text-muted hover:text-ink">
                  Wszystkie →
                </Link>
              }
            >
              {active.length ? (
                <div className="space-y-3">
                  {active.slice(0, 3).map((o) => (
                    <OrderCard key={o.id} o={o} today={t} compact />
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-[13.5px] text-dim">Brak aktywnych zleceń.</p>
              )}
            </Panel>
          </div>
        )}
        <div className={hasProject ? "lg:col-span-4" : "lg:col-span-12"}>
          <Panel i={3} title="Kontakt">
            <div className={`grid gap-2 ${hasProject ? "" : "sm:grid-cols-3"}`}>
              {contact.map((c) => (
                <Row key={c.label} href={c.href} icon={c.icon} title={c.value} sub={c.label} />
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
