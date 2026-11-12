import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { adminCategories } from "@/lib/projects";
import { blobMode } from "@/lib/storage";
import { Icon, PageHead } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import WorkForm from "@/components/panel/portfolio/WorkForm";

export const metadata: Metadata = { title: "Nowa praca" };

export default async function NewWork({ searchParams }: { searchParams: Promise<{ kategoria?: string }> }) {
  await requireAdmin();
  const [{ kategoria }, categories, blob] = await Promise.all([searchParams, adminCategories(), blobMode()]);
  if (!categories.length) redirect("/panel/admin/portfolio");
  const current = categories.find((c) => c.id === kategoria) ?? categories[0];
  return (
    <>
      <PageHead kicker="Portfolio" title="Nowa praca">
        <Link href={`/panel/admin/portfolio/kategoria/${current.id}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-line-2 px-4 text-[13.5px] text-muted transition-colors hover:border-white/30 hover:text-ink">
          <Icon d={ICONS.arrowUp} className="size-4 -rotate-90" />
          {current.name}
        </Link>
      </PageHead>
      <WorkForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} initialCategory={current.id} blob={blob} />
    </>
  );
}
