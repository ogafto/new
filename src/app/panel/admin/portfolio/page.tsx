import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { getAllProjects } from "@/lib/projects";
import { projectStats } from "@/lib/analytics";
import { Icon, PageHead } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import ProjectList from "@/components/panel/ProjectList";

export const metadata: Metadata = { title: "Portfolio" };

export default async function PortfolioAdmin() {
  await requireAdmin();
  const [projects, stats] = await Promise.all([getAllProjects(), projectStats(30)]);
  const views = Object.fromEntries(stats.map((s) => [s.slug, { views: Number(s.views), visitors: Number(s.visitors) }]));
  return (
    <>
      <PageHead title="Portfolio">
        <a href="/portfolio" target="_blank" className="inline-flex h-10 items-center gap-2 rounded-full border border-line-2 px-4 text-[13.5px] text-muted transition-colors hover:border-white/30 hover:text-ink">
          <Icon d={ICONS.site} className="size-4" />
          Na stronie
        </a>
        <Link href="/panel/admin/portfolio/nowy" className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[13.5px] font-medium text-bg transition-colors hover:bg-white">
          <Icon d={ICONS.plus} className="size-4" />
          Dodaj projekt
        </Link>
      </PageHead>
      <ProjectList projects={projects} views={views} />
    </>
  );
}
