import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth/session";
import { sitesForUser } from "@/lib/cms";
import { fmtDate } from "@/lib/format";
import { site, steps } from "@/lib/site";
import { Badge, Card, CardHead, Icon } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import ProjectProgress from "@/components/panel/ProjectProgress";
import ClientHero from "@/components/panel/client/ClientHero";
import { Mark } from "@/components/brand/Logo";
import { loadContent } from "@/lib/content-server";
import { paymentsForUser, zl } from "@/lib/finance";

const DISCORD = "M8.5 15.5c-.6.9-1.5 1.8-1.5 1.8-2.6-.1-3.5-1.8-3.5-1.8 0-3.8 1.7-6.9 1.7-6.9 1.7-1.3 3.3-1.2 3.3-1.2l.2.3M15.5 15.5c.6.9 1.5 1.8 1.5 1.8 2.6-.1 3.5-1.8 3.5-1.8 0-3.8-1.7-6.9-1.7-6.9-1.7-1.3-3.3-1.2-3.3-1.2l-.2.3M7.5 8.5a12 12 0 019 0M7.5 16a12 12 0 009 0M9.5 13h.01M14.5 13h.01";
const dateFmt = (d: string) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" }).format(new Date(`${d}T12:00:00`));

export default async function ClientPanel({ searchParams }: { searchParams: Promise<{ witaj?: string }> }) {
  await loadContent();
  const user = await requireUser();
  if (isAdmin(user)) redirect("/panel/admin");
  const [{ witaj }, sites, payments] = await Promise.all([searchParams, sitesForUser(user.id), paymentsForUser(user.id, user.email)]);
  const due = payments.filter((p) => p.status === "pending");
  const paid = payments.filter((p) => p.status === "paid");
  const dueSum = due.reduce((a, p) => a + Number(p.amount), 0);
  const paidSum = paid.reduce((a, p) => a + Number(p.amount), 0);
  const first = user.name.split(" ")[0];
  const stage = Number(user.stage);
  const doneAll = stage >= steps.length;

  const contact = [
    { label: "E-mail", value: site.email, href: `mailto:${site.email}`, icon: ICONS.mail },
    { label: "Telefon", value: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}`, icon: ICONS.phone },
    { label: "Discord", value: "Napisz na Discordzie", href: site.socials.find((s) => s.label === "Discord")?.href ?? "#", icon: DISCORD, external: true },
  ];

  return (
    <>
      <ClientHero
        welcome={!!witaj}
        kicker={witaj ? "Konto gotowe — witaj na pokładzie" : new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Warsaw" }).format(new Date())}
        first={first}
        project={user.project || "Projekt w przygotowaniu"}
        stage={stage}
        stats={[
          { label: "Teraz", value: doneAll ? "Opublikowano" : steps[stage]?.title ?? "—", icon: ICONS.clock, tone: "accent" },
          { label: "Następny krok", value: doneAll ? "Rozwój i wsparcie" : (steps[stage + 1]?.title ?? "Publikacja"), icon: ICONS.arrowUp },
          due.length
            ? { label: "Do zapłaty", value: zl(dueSum), icon: ICONS.wallet, tone: "amber" as const, href: "#platnosci" }
            : { label: "Płatności", value: payments.length ? "Wszystko opłacone" : "Brak", icon: ICONS.check, tone: "green" as const },
        ]}
      />

      <Card delay={0.08} className="mb-4 lg:mb-5">
        <CardHead title="Etapy projektu" sub={doneAll ? "Projekt opublikowany" : `${steps[stage]?.title ?? ""} · ${steps[stage]?.lead ?? ""}`}>
          <Badge tone={doneAll ? "green" : "accent"}>{doneAll ? "Gotowe" : `Etap ${stage + 1} z ${steps.length}`}</Badge>
        </CardHead>
        <ProjectProgress stage={stage} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr] lg:gap-5">
        <div className="grid content-start gap-4 lg:gap-5">
          <div id="platnosci" className="scroll-mt-24">
            <Card delay={0.12} glow={due.length > 0}>
              <CardHead title="Płatności" sub={due.length ? `${due.length} do opłacenia` : payments.length ? "Wszystko opłacone" : undefined}>
                {paidSum > 0 && (
                  <span className="text-right">
                    <span className="block text-[11.5px] text-dim">Opłacono</span>
                    <span className="block text-[15px] text-emerald-300 tabular-nums">{zl(paidSum)}</span>
                  </span>
                )}
              </CardHead>
              {payments.length === 0 ? (
                <div className="flex items-center gap-3 rounded-2xl border border-dashed border-white/[0.1] p-4 text-[13.5px] text-dim">
                  <span className="grid size-9 place-items-center rounded-xl bg-white/[0.04]">
                    <Icon d={ICONS.receipt} className="size-4" />
                  </span>
                  Nie masz żadnych płatności.
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {due.map((p) => (
                    <li key={p.id} className="relative overflow-hidden rounded-2xl border border-accent/25 bg-[linear-gradient(135deg,rgb(139_108_255/0.12),rgb(139_108_255/0.03))] p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[15px] leading-snug">{p.title}</p>
                          {p.due_date && (
                            <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted">
                              <Icon d={ICONS.calendar} className="size-3.5 text-dim" />
                              Termin: {dateFmt(p.due_date)}
                            </p>
                          )}
                        </div>
                        <p className="h-display shrink-0 text-[26px] leading-none tabular-nums">{zl(Number(p.amount))}</p>
                      </div>
                      {p.stripe_url ? (
                        <a href={p.stripe_url} target="_blank" rel="noopener noreferrer" className="mt-4 flex h-11 items-center justify-center gap-2 rounded-full bg-ink text-[14px] font-medium text-bg transition-colors hover:bg-white sm:inline-flex sm:px-6">
                          <Icon d={ICONS.card} className="size-4" /> Zapłać online
                        </a>
                      ) : (
                        <p className="mt-3 text-[12.5px] text-muted">Płatność przelewem — szczegóły w mailu.</p>
                      )}
                    </li>
                  ))}
                  {paid.length > 0 && (
                    <li className={due.length ? "pt-2" : ""}>
                      {due.length > 0 && <p className="mb-1.5 px-1 text-[12px] text-dim">Historia</p>}
                      <ul className="divide-y divide-white/[0.05]">
                        {paid.slice(0, 5).map((p) => (
                          <li key={p.id} className="flex items-center gap-3 px-1 py-2.5">
                            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20">
                              <Icon d={ICONS.check} className="size-3.5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13.5px]">{p.title}</span>
                              {p.paid_at && <span className="block text-[11.5px] text-dim">{fmtDate(Number(p.paid_at))}</span>}
                            </span>
                            <span className="text-[13.5px] text-muted tabular-nums">{zl(Number(p.amount))}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  )}
                </ul>
              )}
            </Card>
          </div>

          {sites.length > 0 && (
            <Card delay={0.16}>
              <CardHead title="Twoja strona" sub="Edytuj treści samodzielnie" />
              <ul className="space-y-2">
                {sites.map((s) => (
                  <li key={s.id}>
                    <Link href={`/panel/strona/${s.id}`} className="group flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5 transition-colors hover:border-accent/40 hover:bg-accent/[0.05]">
                      <span className="grid size-10 place-items-center rounded-xl bg-accent/15 text-accent-2">
                        <Icon d={ICONS.layers} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px]">{s.name}</span>
                        <span className="block truncate text-[12.5px] text-dim">{s.domain ?? "Edytor treści"}</span>
                      </span>
                      <span className="flex items-center gap-1 text-[13px] text-muted transition-colors group-hover:text-ink">
                        Edytuj
                        <Icon d={ICONS.arrowUp} className="size-4 rotate-90 transition-transform duration-500 ease-out-expo group-hover:translate-x-1" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="grid content-start gap-4 lg:gap-5">
          <Card delay={0.14} pad={false}>
            <div className="flex items-center gap-3.5 p-5 pb-4 sm:p-6 sm:pb-4">
              <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,rgb(139_108_255/0.35),rgb(139_108_255/0.08))] ring-1 ring-accent/30">
                <Mark className="size-7" />
                <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-emerald-400 ring-[3px] ring-[rgb(16_16_22)]" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px]">{site.legal.owner}</p>
                <p className="text-[12.5px] text-dim">Twój projektant · {site.domain}</p>
              </div>
            </div>
            <ul className="px-3 pb-3">
              {contact.map((c) => (
                <li key={c.label}>
                  <a href={c.href} target={c.external ? "_blank" : undefined} rel="noopener noreferrer" className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-white/[0.04]">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-muted transition-colors group-hover:text-accent-2">
                      <Icon d={c.icon} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11.5px] text-dim">{c.label}</span>
                      <span className="block truncate text-[13.5px]">{c.value}</span>
                    </span>
                    <Icon d={ICONS.arrowUp} className="size-4 rotate-45 text-dim opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                </li>
              ))}
            </ul>
          </Card>

          <Card delay={0.18}>
            <CardHead title="Konto" />
            <dl className="divide-y divide-white/[0.05] text-[13.5px]">
              {[
                ["E-mail", user.email],
                ["Telefon", user.phone || "—"],
                ["Klient od", fmtDate(Number(user.created_at))],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                  <dt className="text-dim">{k}</dt>
                  <dd className="truncate">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
