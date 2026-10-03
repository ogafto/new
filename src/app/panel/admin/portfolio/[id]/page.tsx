import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getProjectById } from "@/lib/projects";
import { PageHead } from "@/components/panel/kit";
import ProjectForm from "@/components/panel/ProjectForm";

export const metadata: Metadata = { title: "Edytuj projekt" };

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const p = await getProjectById((await params).id);
  if (!p) notFound();
  return (
    <>
      <PageHead title={p.name} />
      <ProjectForm project={p} />
    </>
  );
}
