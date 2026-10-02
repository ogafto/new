import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth/session";
import { sitesForUser } from "@/lib/cms";
import { fmtDate } from "@/lib/format";
import { site, steps } from "@/lib/site";
import { Badge, Card, CardHead, Icon, PageHead } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import ProjectProgress from "@/components/panel/ProjectProgress";
import { loadContent } from "@/lib/content-server";
import { paymentsForUser, zl } from "@/lib/finance";

export default async function ClientPanel({ searchParams }: { searchParams: Promise<{ witaj?: string }> }) {
  await loadContent();
  const user = await requireUser();
  if (isAdmin(user)) redirect("/panel/admin");
  const [{ witaj }, sites, payments] = await Promise.all([searchParams, sitesForUser(user.id), paymentsForUser(user.id, user.email)]);
  const due = payments.filter((p) => p.status === "pending");
  const paid = payments.filter((p) => p.status === "paid");
  const first = user.name.split(" ")[0];
  const stage = Number(user.stage);

  const contact = [
    { label: "E-mail", value: site.email, href: `mailto:${site.email}`, icon: ICONS.mail },
    { label: "Telefon", value: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}`, icon: ICONS.phone },
    { label: "Discord", value: "Napisz na Discordzie", href: site.socials.find((s) => s.label === "Discord")?.href ?? "#", icon: ICONS.inbox },
  ];

  return (
    <>
      <PageHead kicker={witaj ? "Konto gotowe — witaj na pokładzie" : "Panel klienta"} title={`Cześć, ${first}.`} />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card glow>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[13px] text-dim">Twój projekt</p>
              <h2 className="h-display mt-2 text-[32px]">{user.project || "W przygotowaniu"}</h2>
            </div>
            <Badge tone="accent">{stage >= steps.length ? "Opublikowano" : `Etap ${stage + 1} z ${steps.length}`}</Badge>
          </div>
          <ProjectProgress stage={stage} />
        </Card>

        <div className="grid gap-4">
          {payments.length > 0 && (
            <Card delay={0.03} glow={due.length > 0}>
              <CardHead title="Płatności" sub={due.length ? `${due.length} do opłacenia` : "Wszystko opłacone ✓"} />
              <ul className="space-y-2">
                {due.map((p) => (
                  <li key={p.id} className="rounded-2xl border border-accent/25 bg-accent/[0.05] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[14.5px] leading-snug">{p.title}</p>
                        {p.due_date && <p className="mt-0.5 text-[12.5px] text-dim">Termin: {new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" }).format(new Date(`${p.due_date}T12:00:00`))}</p>}
                      </div>
                      <p className="shrink-0 text-[17px] tabular-nums">{zl(Number(p.amount))}</p>
                    </div>
                    {p.stripe_url ? (
                      <a href={p.stripe_url} target="_blank" rel="noopener noreferrer" className="mt-3.5 flex h-11 items-center justify-center gap-2 rounded-full bg-ink text-[14px] font-medium text-bg transition-colors hover:bg-white">
                        <Icon d={ICONS.card} className="size-4" /> Zapłać online
                      </a>
                    ) : (
                      <p className="mt-3 text-[12.5px] text-muted">Płatność przelewem — szczegóły dostaniesz mailem.</p>
                    )}
                  </li>
                ))}
                {paid.slice(0, 4).map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-400/10 text-emerald-300">
                      <Icon d={ICONS.check} className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13.5px] text-muted">{p.title}</span>
                    <span className="text-[13.5px] tabular-nums">{zl(Number(p.amount))}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {sites.length > 0 && (
            <Card delay={0.05}>
              <CardHead title="Twoja strona" sub="Edytuj treści samodzielnie" />
              <ul className="space-y-2">
                {sites.map((s) => (
                  <li key={s.id}>
                    <Link href={`/panel/strona/${s.id}`} className="group flex items-center gap-3 rounded-2xl border border-line p-3.5 transition-colors hover:border-accent/40 hover:bg-accent/[0.05]">
                      <span className="grid size-10 place-items-center rounded-xl bg-accent/15 text-accent-2">
                        <Icon d={ICONS.layers} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px]">{s.name}</span>
                        <span className="block truncate text-[12.5px] text-dim">{s.domain ?? "Edytor treści"}</span>
                      </span>
                      <span className="text-muted transition-transform duration-500 ease-out-expo group-hover:translate-x-1">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card delay={0.1}>
            <CardHead title="Kontakt" />
            <ul className="space-y-1">
              {contact.map((c) => (
                <li key={c.label}>
                  <a href={c.href} target={c.label === "Discord" ? "_blank" : undefined} rel="noopener noreferrer" className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.03]">
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
          <Card delay={0.15}>
            <CardHead title="Konto" />
            <dl className="space-y-3 text-[14px]">
              {[
                ["E-mail", user.email],
                ["Telefon", user.phone || "—"],
                ["Klient od", fmtDate(Number(user.created_at))],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
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
