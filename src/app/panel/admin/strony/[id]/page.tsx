import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { all } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { getSite } from "@/lib/cms";
import { loadCollections, origin } from "@/lib/cms-load";
import { PageHead } from "@/components/panel/kit";
import SiteAdmin from "@/components/panel/SiteAdmin";

export const metadata: Metadata = { title: "Strona klienta" };

export default async function SitePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const site = await getSite((await params).id);
  if (!site) notFound();
  const [collections, clients, o] = await Promise.all([loadCollections(site.id), all<{ id: string; name: string; email: string }>("SELECT id, name, email FROM users WHERE role = 'client' AND verified_at IS NOT NULL ORDER BY name"), origin()]);
  return (
    <>
      <PageHead kicker={site.domain ?? "Strona klienta"} title={site.name}>
        <Link href="/panel/admin/strony" className="text-[13px] text-muted hover:text-ink">
          ← Wszystkie strony
        </Link>
      </PageHead>
      <SiteAdmin site={{ ...site, created_at: Number(site.created_at), updated_at: Number(site.updated_at) }} collections={collections} clients={clients} origin={o} />
    </>
  );
}
