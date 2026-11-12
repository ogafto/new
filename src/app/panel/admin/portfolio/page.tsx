import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { adminCategories } from "@/lib/projects";
import { projectStats } from "@/lib/analytics";
import { Icon, PageHead } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import CategoryBoard from "@/components/panel/portfolio/CategoryBoard";

export const metadata: Metadata = { title: "Portfolio" };

export default async function PortfolioAdmin() {
  await requireAdmin();
  const [categories, stats] = await Promise.all([adminCategories(), projectStats(30)]);
  const views = Object.fromEntries(stats.map((s) => [s.slug, Number(s.views)]));
  return (
    <>
      <PageHead kicker="Strona" title="Portfolio" text="Kategorie i prace. Wejdź w kategorię, żeby wrzucić do niej zdjęcia.">
        <a href="/#portfolio" target="_blank" className="inline-flex h-10 items-center gap-2 rounded-full border border-line-2 px-4 text-[13.5px] text-muted transition-colors hover:border-white/30 hover:text-ink">
          <Icon d={ICONS.site} className="size-4" />
          Na stronie
        </a>
      </PageHead>
      <CategoryBoard categories={categories} views={views} />
    </>
  );
}
