import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { contentHistory, getContent } from "@/lib/content-server";
import { defaultContent } from "@/lib/content";
import { BUILTIN_SERVICES, type ServiceId } from "@/lib/site";
import { PageHead } from "@/components/panel/kit";
import ContentForm from "@/components/panel/ContentForm";

export const metadata: Metadata = { title: "Treści strony" };

export default async function ContentPage() {
  await requireAdmin();
  const [content, history] = await Promise.all([getContent(), contentHistory()]);
  return (
    <>
      <PageHead kicker="Strona" title="Treści strony" />
      <ContentForm initial={content} defaults={defaultContent()} services={BUILTIN_SERVICES.map((s) => ({ id: s.id as ServiceId, name: s.name }))} history={history.map((h) => ({ ts: h.ts, actor: h.actor, section: h.section }))} />
    </>
  );
}
