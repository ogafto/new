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
      {/* kontener z pionowymi liniami po bokach — cała strona "siedzi" na siatce */}
      <div className="mx-3 border-x border-line sm:mx-6 2xl:mx-auto 2xl:max-w-[1440px]">
        <main>
          <Hero />
          <Work />
          <Process />
          <Contact />
        </main>
        <Footer />
      </div>
    </>
  );
}
