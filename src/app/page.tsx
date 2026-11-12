import Navbar from "@/components/Navbar";
import Hero from "@/components/hero/Hero";
import Showcase, { type ShowCategory } from "@/components/work/Showcase";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { homeSchema } from "@/lib/seo";
import { getPortfolio, latestWorks } from "@/lib/projects";

export default async function Home() {
  const cats = await getPortfolio();
  // do przeglądarki tylko to, co potrzebne pokazowi (bez list wszystkich prac)
  const show: ShowCategory[] = cats.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    image: c.image,
    count: c.works.length,
  }));
  const recent = latestWorks(cats, 4).map((w) => ({ id: w.id, slug: w.slug, name: w.name, image: w.image, category: w.category }));
  return (
    <>
      <JsonLd data={homeSchema(cats)} />
      <Navbar />
      <main>
        <Hero recent={recent} />
        <Showcase categories={show} />
      </main>
      <Footer />
    </>
  );
}
