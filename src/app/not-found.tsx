import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import NotFound from "@/components/NotFound";

// Każdy nieistniejący adres (stare kategorie i prace przekierowują same, patrz portfolio/[slug])
export const metadata: Metadata = { title: "404", robots: { index: false, follow: true } };

export default function NotFoundPage() {
  return (
    <>
      <Navbar />
      <NotFound />
    </>
  );
}
