import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CaseStudy from "@/components/work/CaseStudy";
import { serviceName } from "@/lib/site";
import { getProjectBySlug, getProjects } from "@/lib/projects";
import JsonLd from "@/components/JsonLd";
import { projectSchema } from "@/lib/seo";

export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProjectBySlug(slug);
  if (!p) return {};
  const title = `${p.name} — ${serviceName(p.category).toLowerCase()} · ${p.client}`;
  return {
    title,
    description: `${p.description} ${serviceName(p.category)} — projekt ${p.year}. Zakres: ${p.scope.join(", ")}.`,
    alternates: { canonical: `/portfolio/${p.slug}` },
    openGraph: { title, description: p.description, url: `/portfolio/${p.slug}`, type: "article", images: [{ url: p.image, width: 1600, height: 1200, alt: p.name }] },
    twitter: { card: "summary_large_image", title, description: p.description, images: [p.image] },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const projects = await getProjects();
  const i = projects.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  return (
    <>
      <JsonLd data={projectSchema(projects[i])} />
      <Navbar />
      <CaseStudy p={projects[i]} next={projects[(i + 1) % projects.length]} />
      <Footer />
    </>
  );
}
