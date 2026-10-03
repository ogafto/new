import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth/session";
import { clientOrders, clientRequests } from "@/lib/client";
import { loadContent } from "@/lib/content-server";
import { paymentsForUser, zl } from "@/lib/finance";
import { daysBetween, today } from "@/lib/orders";
import { site, steps } from "@/lib/site";
import { Badge, Card, CardHead, Empty, Icon } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import CockpitHero from "@/components/panel/CockpitHero";
import ProjectProgress from "@/components/panel/ProjectProgress";
import { OrderCard } from "@/components/panel/client/Orders";

const DISCORD = "M8.5 15.5c-.6.9-1.5 1.8-1.5 1.8-2.6-.1-3.5-1.8-3.5-1.8 0-3.8 1.7-6.9 1.7-6.9 1.7-1.3 3.3-1.2 3.3-1.2l.2.3M15.5 15.5c.6.9 1.5 1.8 1.5 1.8 2.6-.1 3.5-1.8 3.5-1.8 0-3.8-1.7-6.9-1.7-6.9-1.7-1.3-3.3-1.2-3.3-1.2l-.2.3M7.5 8.5a12 12 0 019 0M7.5 16a12 12 0 009 0M9.5 13h.01M14.5 13h.01";
const longDate = (d: string) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" }).format(new Date(`${d}T12:00:00`));

export default async function ClientPanel({ searchParams }: { searchParams: Promise<{ witaj?: string }> }) {
  await loadContent();
  const user = await requireUser();
  if (isAdmin(user)) redirect("/panel/admin");
  const [{ witaj }, payments, orders, requests] = await Promise.all([searchParams, paymentsForUser(user.id, user.email), clientOrders(user.id, user.email), clientRequests(user.id, user.email)]);
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
      openRequests.length ? `${openRequests.length} ${openRequests.length === 1 ? "zgłoszenie czeka na odpowiedź" : "zgłoszenia czekają na odpowiedź"}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Zamów stronę, sklep, identyfikację albo projekt UI — wszystko ogarniesz tutaj.";

  const contact = [
    { label: "E-mail", value: site.email, href: `mailto:${site.email}`, icon: ICONS.mail },
    { label: "Telefon", value: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}`, icon: ICONS.phone },
    { label: "Discord", value: "Napisz na Discordzie", href: site.socials.find((s) => s.label === "Discord")?.href ?? "#", icon: DISCORD, external: true },
  ];

  return (
    <>
      <CockpitHero
        scene3d
        greeting={witaj ? "Witaj w afto," : "Cześć,"}
        name={`${first}.`}
        accent={accent}
        date={new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Warsaw" }).format(new Date())}
        chip={
          <span className="inline-flex items-center gap-2 rounded-full border border-line-2 px-3 py-1.5 text-[12.5px] text-muted">
            <span className="size-1.5 rounded-full bg-accent-2" /> Panel klienta
          </span>
        }
        summary={summary}
        stats={[
          { label: "aktywne zlecenia", value: active.length, href: "/panel/zamowienia" },
          { label: "dni do terminu", value: nextDue ? Math.max(0, daysBetween(t, nextDue.due_date)) : 0, href: "/panel/zamowienia" },
          { label: "do zapłaty", value: Math.round(dueSum / 100), suffix: " zł", href: "/panel/platnosci" },
          { label: "zgłoszenia", value: requests.length, href: "/panel/zamowienia" },
        ]}
        actions={
          <>
            <Link href="/panel/zamow" className="group btn btn-primary !h-12 text-[14.5px]">
              <span className="roll">
                <span>Zamów usługę</span>
                <span aria-hidden>Zamów usługę</span>
              </span>
              <span className="dot !size-9">
                <Icon d={ICONS.plus} className="size-4" />
              </span>
            </Link>
            <Link href="/panel/zamowienia" className="btn btn-outline !h-12 text-[14.5px]">
              Moje zamówienia
            </Link>
          </>
        }
      />

      {hasProject && (
        <Card className="mb-4 lg:mb-5">
          <CardHead title={user.project ?? "Twój projekt"} sub={done ? "Projekt opublikowany" : `${steps[stage]?.title ?? ""} · ${steps[stage]?.lead ?? ""}`}>
            <Badge tone={done ? "green" : "accent"}>{done ? "Gotowe" : `Etap ${stage + 1} z ${steps.length}`}</Badge>
          </CardHead>
          <ProjectProgress stage={stage} />
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] lg:gap-5">
        <Card delay={0.05}>
          <CardHead title="Zlecenia w toku" sub={active.length ? `${active.length} aktywne` : undefined}>
            <Link href="/panel/zamowienia" className="text-[13px] text-muted hover:text-ink">
              Wszystkie →
            </Link>
          </CardHead>
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
        </Card>

        <div className="grid content-start gap-4 lg:gap-5">
          <Card delay={0.1} glow={due.length > 0}>
            <CardHead title="Płatności" sub={due.length ? `${due.length} do opłacenia` : "Wszystko opłacone"}>
              <Link href="/panel/platnosci" className="text-[13px] text-muted hover:text-ink">
                Historia →
              </Link>
            </CardHead>
            {due.length ? (
              <ul className="space-y-2.5">
                {due.slice(0, 3).map((p) => (
                  <li key={p.id} className="rounded-2xl border border-accent/25 bg-accent/[0.05] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-[14.5px] leading-snug">{p.title}</p>
                      <p className="shrink-0 text-[17px] tabular-nums">{zl(Number(p.amount))}</p>
                    </div>
                    {p.stripe_url && (
                      <a href={p.stripe_url} target="_blank" rel="noopener noreferrer" className="mt-3 flex h-10 items-center justify-center gap-2 rounded-full bg-ink text-[13.5px] font-medium text-bg transition-colors hover:bg-white">
                        <Icon d={ICONS.card} className="size-4" /> Zapłać online
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2 text-[14px] text-emerald-200">
                <Icon d={ICONS.check} className="size-4" /> Nic do zapłaty
              </p>
            )}
          </Card>

          <Card delay={0.15}>
            <CardHead title="Kontakt" />
            <ul className="-mx-2 space-y-1">
              {contact.map((c) => (
                <li key={c.label}>
                  <a href={c.href} target={c.external ? "_blank" : undefined} rel="noopener noreferrer" className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.03]">
                    <span className="grid size-9 place-items-center rounded-xl bg-white/[0.04] text-muted group-hover:text-accent-2">
                      <Icon d={c.icon} className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11.5px] text-dim">{c.label}</span>
                      <span className="block truncate text-[14px]">{c.value}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
