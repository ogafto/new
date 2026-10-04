import type { Metadata } from "next";
import Link from "next/link";
import { all } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { listSites } from "@/lib/cms";
import { fmtDateTime } from "@/lib/format";
import { Badge, Card, Empty, Icon, PageHead } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import { NewSite } from "@/components/panel/SiteAdmin";

export const metadata: Metadata = { title: "Strony klientów" };

export default async function SitesPage() {
  await requireAdmin();
  const [sites, clients] = await Promise.all([listSites(), all<{ id: string; name: string; email: string }>("SELECT id, name, email FROM users WHERE role = 'client' AND verified_at IS NOT NULL ORDER BY name")]);
  return (
    <>
      <PageHead title="Strony klientów" text="Strony Twoich klientów podpięte pod CMS — klient edytuje treści i swoje klucze z panelu, a strona pobiera je z API.">
        <NewSite clients={clients} />
      </PageHead>
      {sites.length === 0 ? (
        <Card>
          <Empty icon={ICONS.layers} title="Brak stron" text="Utwórz stronę dla klienta — dostanie w panelu prosty edytor treści, a jego strona pobierze je z API." />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sites.map((s, i) => (
            <Card key={s.id} delay={i * 0.04} className="group transition-colors hover:bg-surface">
              <Link href={`/panel/admin/strony/${s.id}`} className="block">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-accent/30 to-accent-2/10 text-accent-2">
                    <Icon d={ICONS.globe} />
                  </span>
                  <Badge tone={s.owner_id ? "green" : "default"}>{s.owner_name ?? "Bez klienta"}</Badge>
                </div>
                <p className="mt-5 text-[18px] tracking-[-0.01em]">{s.name}</p>
                <p className="mt-0.5 truncate text-[13px] text-dim">{s.domain ?? "domena nieustawiona"}</p>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-[12.5px] text-dim">
                  <span className="flex items-center gap-1.5">
                    <span className={`size-1.5 rounded-full ${s.last_seen ? "bg-emerald-400" : "bg-amber-300"}`} />
                    {s.last_seen ? "połączona" : "niepołączona"} · {Number(s.entries)} treści
                  </span>
                  <span>zmiana {fmtDateTime(Number(s.updated_at))}</span>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
