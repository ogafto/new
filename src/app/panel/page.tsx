import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { fmtDate } from "@/lib/format";
import { site, steps } from "@/lib/site";
import { Card, PageHead } from "@/components/panel/ui";
import ProjectProgress from "@/components/panel/ProjectProgress";

export default async function ClientPanel({ searchParams }: { searchParams: Promise<{ witaj?: string }> }) {
  const user = await requireUser();
  if (user.role === "admin") redirect("/panel/admin");
  const { witaj } = await searchParams;
  const first = user.name.split(" ")[0];

  const contact = [
    { label: "E-mail", value: site.email, href: `mailto:${site.email}` },
    { label: "Telefon", value: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}` },
    { label: "Discord", value: "Napisz na Discordzie", href: site.socials.find((s) => s.label === "Discord")?.href ?? "#" },
  ];

  return (
    <>
      <PageHead kicker={witaj ? "Konto gotowe" : "Panel klienta"} title={`Cześć, ${first}.`} />

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[13px] text-dim">Twój projekt</p>
              <h2 className="mt-1.5 text-[24px] font-medium tracking-[-0.02em]">{user.project || "Projekt w przygotowaniu"}</h2>
            </div>
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[12px] text-accent-2">
              {user.stage >= steps.length ? "Opublikowano" : `Etap ${user.stage + 1} z ${steps.length}`}
            </span>
          </div>
          <ProjectProgress stage={user.stage} />
        </Card>

        <div className="grid gap-5">
          <Card delay={0.08}>
            <p className="text-[13px] text-dim">Kontakt</p>
            <ul className="mt-4 divide-y divide-line">
              {contact.map((c) => (
                <li key={c.label}>
                  <a href={c.href} target={c.label === "Discord" ? "_blank" : undefined} rel="noopener noreferrer" className="group flex items-center justify-between gap-4 py-3 text-[15px]">
                    <span>
                      <span className="block text-[12px] text-dim">{c.label}</span>
                      {c.value}
                    </span>
                    <span className="text-muted transition-transform duration-500 ease-out-expo group-hover:translate-x-1 group-hover:text-ink">→</span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
          <Card delay={0.16}>
            <p className="text-[13px] text-dim">Konto</p>
            <dl className="mt-4 space-y-3 text-[15px]">
              <div>
                <dt className="text-[12px] text-dim">E-mail</dt>
                <dd className="truncate">{user.email}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-dim">Klient od</dt>
                <dd>{fmtDate(user.created_at)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
