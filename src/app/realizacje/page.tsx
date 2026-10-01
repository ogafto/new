import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AllWork from "@/components/work/AllWork";

export const metadata: Metadata = {
  title: "Realizacje",
  description: "Strony internetowe, sklepy, identyfikacje wizualne i projekty UI/UX.",
  alternates: { canonical: "/realizacje" },
};

export default function WorkIndex() {
  return (
    <>
      <Navbar />
      <main>
        <AllWork />
      </main>
      <Footer />
    </>
  );
}
