import Navbar from "@/components/Navbar";
import Hero from "@/components/hero/Hero";
import Work from "@/components/work/Work";
import Process from "@/components/Process";
import Faq from "@/components/Faq";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { homeSchema } from "@/lib/seo";

export default function Home() {
  return (
    <>
      <JsonLd data={homeSchema()} />
      <Navbar />
      <main>
        <Hero />
        <Work />
        <Process />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
