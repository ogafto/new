import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Gallery from "@/components/work/Gallery";
import JsonLd from "@/components/JsonLd";
import { categorySchema } from "@/lib/seo";
import { findWork, getPortfolio } from "@/lib/projects";
import { plural } from "@/lib/format";
import { isVideo } from "@/lib/media";

export async function generateStaticParams() {
  return (await getPortfolio()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = (await getPortfolio()).find((x) => x.slug === slug);
  if (!c) return {};
  const n = c.works.length;
  const title = c.name; // w karcie: „Nazwa kategorii | afto.works” (szablon z layoutu)
  const cover = c.works.find((w) => !isVideo(w.image))?.image; // podgląd linku: pierwsze zdjęcie (nie wideo)
  const description = c.description || `${c.name}: ${n} ${plural(n, "praca", "prace", "prac")} w portfolio afto.works. Zobacz projekty w pełnym rozmiarze.`;
  return {
    title,
    description,
    alternates: { canonical: `/portfolio/${c.slug}` },
    openGraph: { title: `${title} | afto.works`, description, url: `/portfolio/${c.slug}`, images: cover ? [{ url: cover, alt: c.name }] : undefined },
    twitter: { card: "summary_large_image", title: `${title} | afto.works`, description, images: cover ? [cover] : undefined },
  };
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cats = await getPortfolio();
  const i = cats.findIndex((c) => c.slug === slug);
  if (i < 0) {
    // stary adres pojedynczej pracy (/portfolio/nazwa-pracy) → jej kategoria z otwartą pracą
    const legacy = await findWork(decodeURIComponent(slug));
    if (legacy) permanentRedirect(`/portfolio/${legacy.category}#praca-${legacy.work.slug}`);
    const want = norm(decodeURIComponent(slug));
    const near = want.length >= 3 ? cats.find((c) => norm(c.slug).startsWith(want) || want.startsWith(norm(c.slug)) || norm(c.name).startsWith(want)) : undefined;
    permanentRedirect(near ? `/portfolio/${near.slug}` : "/#portfolio");
  }
  const c = cats[i];
  return (
    <>
      <JsonLd data={categorySchema(c)} />
      <Navbar />
      <Gallery category={{ name: c.name, works: c.works }} />
      <Footer />
    </>
  );
}
