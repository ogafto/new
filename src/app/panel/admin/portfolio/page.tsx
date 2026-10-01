import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { getAllProjects } from "@/lib/projects";
import { Icon, PageHead } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import ProjectList from "@/components/panel/ProjectList";

export const metadata: Metadata = { title: "Portfolio" };

export default async function PortfolioAdmin() {
  await requireAdmin();
  const projects = await getAllProjects();
  return (
    <>
      <PageHead kicker="Portfolio" title="Twoje projekty">
        <Link href="/panel/admin/portfolio/nowy" className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[13.5px] font-medium text-bg transition-colors hover:bg-white">
          <Icon d={ICONS.plus} className="size-4" />
          Dodaj projekt
        </Link>
      </PageHead>
      <ProjectList projects={projects} />
    </>
  );
}
