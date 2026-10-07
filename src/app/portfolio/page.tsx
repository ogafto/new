import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AllWork from "@/components/work/AllWork";
import JsonLd from "@/components/JsonLd";
import { portfolioSchema } from "@/lib/seo";
import { getProjects } from "@/lib/projects";

const description = "Portfolio: strony internetowe, sklepy internetowe, identyfikacje wizualne i projekty UI/UX zaprojektowane od zera.";

export const metadata: Metadata = {
  title: "Portfolio: strony, sklepy i identyfikacje",
  description,
  alternates: { canonical: "/portfolio" },
  openGraph: { title: "Portfolio | afto.works", description, url: "/portfolio", images: ["/opengraph-image"] },
};

export default async function PortfolioPage() {
  const projects = await getProjects();
  return (
    <>
      <JsonLd data={portfolioSchema(projects)} />
      <Navbar />
      <main>
        <AllWork projects={projects} />
      </main>
      <Footer />
    </>
  );
}
