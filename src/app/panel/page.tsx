import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth/session";
import { sitesForUser } from "@/lib/cms";
import { fmtDate } from "@/lib/format";
import { site, steps } from "@/lib/site";
import { Badge, Card, CardHead, Icon, PageHead } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import ProjectProgress from "@/components/panel/ProjectProgress";

export default async function ClientPanel({ searchParams }: { searchParams: Promise<{ witaj?: string }> }) {
  const user = await requireUser();
  if (isAdmin(user)) redirect("/panel/admin");
  const [{ witaj }, sites] = await Promise.all([searchParams, sitesForUser(user.id)]);
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
