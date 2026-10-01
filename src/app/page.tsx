import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Portfolio from "@/components/Portfolio";
import Process from "@/components/Process";
import Services from "@/components/Services";
import Pricing from "@/components/Pricing";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Portfolio />
        <Process />
        <Services />
        <Pricing />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
