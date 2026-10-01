import Navbar from "@/components/Navbar";
import Hero from "@/components/hero/Hero";
import Work from "@/components/work/Work";
import Process from "@/components/Process";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Work />
        <Process />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
