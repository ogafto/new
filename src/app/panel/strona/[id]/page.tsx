import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth/session";
import { getSite } from "@/lib/cms";
import { loadCollections } from "@/lib/cms-load";
import { PageHead } from "@/components/panel/kit";
import CmsEditor from "@/components/panel/CmsEditor";

export const metadata: Metadata = { title: "Moja strona" };

export default async function ClientSite({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const site = await getSite((await params).id);
  if (!site || (!isAdmin(user) && site.owner_id !== user.id)) notFound();
  const collections = await loadCollections(site.id);
  return (
    <>
      <PageHead kicker={site.domain ?? "Twoja strona"} title={site.name}>
        {site.domain && (
          <a href={`https://${site.domain}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-line-2 px-4 text-[13.5px] transition-colors hover:border-white/35">
            Otwórz stronę ↗
          </a>
        )}
      </PageHead>
      <p className="-mt-4 mb-6 max-w-xl text-[14px] text-dim">Zmiany zapisują się od razu i pojawiają na stronie w ciągu minuty.</p>
      <CmsEditor siteId={site.id} collections={collections} />
    </>
  );
}
