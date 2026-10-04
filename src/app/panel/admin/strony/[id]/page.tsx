import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { randomBytes } from "node:crypto";
import { all, run } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { getSite } from "@/lib/cms";
import { loadCollections, origin } from "@/lib/cms-load";
import { PageHead } from "@/components/panel/kit";
import SiteAdmin from "@/components/panel/SiteAdmin";

export const metadata: Metadata = { title: "Strona klienta" };

export default async function SitePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  let site = await getSite((await params).id);
  if (!site) notFound();
  // starsze strony nie miały klucza sekretnego — nadaj przy pierwszym wejściu
  if (!site.secret_key) {
    await run("UPDATE cms_sites SET secret_key = ? WHERE id = ? AND secret_key IS NULL", [`sk_${randomBytes(24).toString("base64url")}`, site.id]);
    site = (await getSite(site.id))!;
  }
  const [collections, clients, o] = await Promise.all([loadCollections(site.id), all<{ id: string; name: string; email: string }>("SELECT id, name, email FROM users WHERE role = 'client' AND verified_at IS NOT NULL ORDER BY name"), origin()]);
  return (
    <>
      <PageHead title={site.name} text={site.domain ?? "Bez adresu — dodaj domenę albo IP w Ustawieniach"}>
        <Link href="/panel/admin/strony" className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.05] px-4 text-[13.5px] text-muted transition-colors hover:text-ink">
          ← Wszystkie strony
        </Link>
      </PageHead>
      <h2 className="mb-5 text-[clamp(1.8rem,3vw,2.6rem)] leading-tight font-medium tracking-[-0.03em]">{site.name}</h2>
      <SiteAdmin site={{ ...site, created_at: Number(site.created_at), updated_at: Number(site.updated_at), last_seen: site.last_seen ? Number(site.last_seen) : null }} collections={collections} clients={clients} origin={o} />
    </>
  );
}
