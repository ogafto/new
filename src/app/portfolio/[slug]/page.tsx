import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CaseStudy from "@/components/work/CaseStudy";
import { serviceName } from "@/lib/site";
import { getProjectBySlug, getProjects } from "@/lib/projects";
import JsonLd from "@/components/JsonLd";
import { projectSchema } from "@/lib/seo";
import { loadContent } from "@/lib/content-server";

export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProjectBySlug(slug);
  if (!p) return {};
  const ap = p as typeof p & { seoTitle?: string | null; seoDescription?: string | null };
  const title = ap.seoTitle || `${p.name} | ${serviceName(p.category).toLowerCase()} · ${p.client}`;
  return {
    title,
    description: ap.seoDescription || `${p.description} ${serviceName(p.category)}, projekt ${p.year}. Zakres: ${p.scope.join(", ")}.`,
    alternates: { canonical: `/portfolio/${p.slug}` },
    openGraph: { title, description: p.description, url: `/portfolio/${p.slug}`, type: "article", images: [{ url: p.image, width: 1600, height: 1200, alt: p.name }] },
    twitter: { card: "summary_large_image", title, description: p.description, images: [p.image] },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  await loadContent();
  const { slug } = await params;
  const projects = await getProjects();
  const i = projects.findIndex((x) => x.slug === slug);
  if (i < 0) {
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    const want = norm(decodeURIComponent(slug));
    const near = want.length >= 3 ? projects.find((x) => { const s = norm(x.slug), n = norm(x.name); return s.startsWith(want) || want.startsWith(s) || want.startsWith(n) || n.startsWith(want); }) : undefined;
    permanentRedirect(near ? `/portfolio/${near.slug}` : "/portfolio");
  }
  return (
    <>
      <JsonLd data={projectSchema(projects[i])} />
      <Navbar />
      <CaseStudy p={projects[i]} next={projects[(i + 1) % projects.length]} />
      <Footer />
    </>
  );
}
