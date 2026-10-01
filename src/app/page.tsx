import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Portfolio from "@/components/Portfolio";
import Process from "@/components/Process";
import Services from "@/components/Services";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="canvas-dots">
        <Hero />
        <Marquee />
        <Portfolio />
        <Process />
        <Services />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
