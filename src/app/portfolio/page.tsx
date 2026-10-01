import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AllWork from "@/components/work/AllWork";
import JsonLd from "@/components/JsonLd";
import { portfolioSchema } from "@/lib/seo";

const description = "Portfolio: strony internetowe, sklepy internetowe, identyfikacje wizualne i projekty UI/UX zaprojektowane od zera.";

export const metadata: Metadata = {
  title: "Portfolio — strony internetowe, sklepy i identyfikacje wizualne",
  description,
  alternates: { canonical: "/portfolio" },
  openGraph: { title: "Portfolio", description, url: "/portfolio" },
};

export default function PortfolioPage() {
  return (
    <>
      <JsonLd data={portfolioSchema()} />
      <Navbar />
      <main>
        <AllWork />
      </main>
      <Footer />
    </>
  );
}
