import Navbar from "@/components/Navbar";
import Hero from "@/components/hero/Hero";
import Work from "@/components/work/Work";
import Process from "@/components/Process";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { homeSchema } from "@/lib/seo";
import { getProjects } from "@/lib/projects";

export default async function Home() {
  const projects = await getProjects();
  return (
    <>
      <JsonLd data={homeSchema()} />
      <Navbar />
      <main>
        <Hero recent={projects.slice(0, 4)} />
        <Work projects={projects} />
        <Process />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
