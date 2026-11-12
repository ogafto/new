import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { adminCategories, adminWork } from "@/lib/projects";
import { blobMode } from "@/lib/storage";
import { Icon, PageHead } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import WorkForm from "@/components/panel/portfolio/WorkForm";

export const metadata: Metadata = { title: "Edytuj pracę" };

export default async function EditWork({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const [w, categories, blob] = await Promise.all([params.then((p) => adminWork(p.id)), adminCategories(), blobMode()]);
  if (!w) notFound();
  const cat = categories.find((c) => c.id === w.categoryId);
  return (
    <>
      <PageHead kicker="Portfolio · edycja" title={w.name}>
        <Link href={cat ? `/panel/admin/portfolio/kategoria/${cat.id}` : "/panel/admin/portfolio"} className="inline-flex h-10 items-center gap-2 rounded-full border border-line-2 px-4 text-[13.5px] text-muted transition-colors hover:border-white/30 hover:text-ink">
          <Icon d={ICONS.arrowUp} className="size-4 -rotate-90" />
          {cat?.name ?? "Portfolio"}
        </Link>
        {cat && (
          <a href={`/portfolio/${cat.slug}#praca-${w.slug}`} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-full border border-line-2 px-4 text-[13.5px] text-muted transition-colors hover:border-white/30 hover:text-ink">
            <Icon d={ICONS.site} className="size-4" />
            Na stronie
          </a>
        )}
      </PageHead>
      <WorkForm key={w.id} work={w} categories={categories.map((c) => ({ id: c.id, name: c.name }))} blob={blob} />
    </>
  );
}
