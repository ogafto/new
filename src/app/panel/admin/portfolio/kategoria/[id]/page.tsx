import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { adminCategory } from "@/lib/projects";
import { blobMode } from "@/lib/storage";
import { Icon, PageHead } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import CategoryView from "@/components/panel/portfolio/CategoryView";

export const metadata: Metadata = { title: "Kategoria" };

export default async function CategoryAdmin({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const [c, blob] = await Promise.all([params.then((p) => adminCategory(p.id)), blobMode()]);
  if (!c) notFound();
  const { works, ...category } = c;
  return (
    <>
      <PageHead kicker="Portfolio" title={c.name}>
        <Link href="/panel/admin/portfolio" className="inline-flex h-10 items-center gap-2 rounded-full border border-line-2 px-4 text-[13.5px] text-muted transition-colors hover:border-white/30 hover:text-ink">
          <Icon d={ICONS.arrowUp} className="size-4 -rotate-90" />
          Kategorie
        </Link>
        <a href={`/portfolio/${c.slug}`} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-full border border-line-2 px-4 text-[13.5px] text-muted transition-colors hover:border-white/30 hover:text-ink">
          <Icon d={ICONS.site} className="size-4" />
          Na stronie
        </a>
      </PageHead>
      <CategoryView key={c.id} category={category} works={works} blob={blob} />
    </>
  );
}
