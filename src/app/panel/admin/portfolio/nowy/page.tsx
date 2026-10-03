import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import Link from "next/link";
import { Icon, PageHead } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import ProjectForm from "@/components/panel/ProjectForm";

export const metadata: Metadata = { title: "Nowy projekt" };

export default async function NewProject() {
  await requireAdmin();
  return (
    <>
      <PageHead kicker="Portfolio" title="Nowy projekt">
        <Link href="/panel/admin/portfolio" className="inline-flex h-10 items-center gap-2 rounded-full border border-line-2 px-4 text-[13.5px] text-muted transition-colors hover:border-white/30 hover:text-ink">
          <Icon d={ICONS.arrowUp} className="size-4 -rotate-90" />
          Wszystkie projekty
        </Link>
      </PageHead>
      <ProjectForm />
    </>
  );
}
