import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getProjectById } from "@/lib/projects";
import Link from "next/link";
import { Icon, PageHead } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import ProjectForm from "@/components/panel/ProjectForm";

export const metadata: Metadata = { title: "Edytuj projekt" };

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const p = await getProjectById((await params).id);
  if (!p) notFound();
  return (
    <>
      <PageHead kicker="Portfolio · edycja" title={p.name}>
        <Link href="/panel/admin/portfolio" className="inline-flex h-10 items-center gap-2 rounded-full border border-line-2 px-4 text-[13.5px] text-muted transition-colors hover:border-white/30 hover:text-ink">
          <Icon d={ICONS.arrowUp} className="size-4 -rotate-90" />
          Wszystkie projekty
        </Link>
      </PageHead>
      <ProjectForm project={p} />
    </>
  );
}
