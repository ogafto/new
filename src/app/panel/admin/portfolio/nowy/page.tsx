import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { PageHead } from "@/components/panel/kit";
import ProjectForm from "@/components/panel/ProjectForm";

export const metadata: Metadata = { title: "Nowy projekt" };

export default async function NewProject() {
  await requireAdmin();
  return (
    <>
      <PageHead title="Nowy projekt" />
      <ProjectForm />
    </>
  );
}
