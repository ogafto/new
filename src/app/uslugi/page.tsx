import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { TLink } from "@/components/Transition";
import { FadeUp, Heading } from "@/components/ui/Reveal";
import { Arrow } from "@/components/ui/Button";
import { offers } from "@/lib/offer";
import { site } from "@/lib/site";
import { loadContent } from "@/lib/content-server";

const description = "Usługi web designera i web developera: projektowanie stron internetowych, sklepy internetowe, identyfikacja wizualna, projekt UI/UX i animacje. Cała Polska.";

export const metadata: Metadata = {
  title: "Usługi — strony internetowe, sklepy, logo, UI/UX, animacje",
  description,
  alternates: { canonical: "/uslugi" },
  openGraph: { title: "Usługi — afto.works", description, url: "/uslugi", images: ["/opengraph-image"] },
};

export default async function ServicesPage() {
  await loadContent();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Usługi afto.works",
          itemListElement: offers.map((o, i) => ({ "@type": "ListItem", position: i + 1, url: `${site.url}/uslugi/${o.slug}`, name: o.h1 })),
        }}
      />
      <Navbar />
      <main className="relative overflow-x-clip">
        <div className="pointer-events-none absolute -top-40 right-0 h-[700px] w-[min(1000px,100vw)] bg-[radial-gradient(closest-side,rgb(139_108_255/0.12),transparent)]" aria-hidden />
        <section className="relative mx-auto max-w-[1400px] px-5 pt-36 pb-28 sm:px-10 sm:pt-44">
          <p className="kicker">Usługi</p>
          <h1 className="h-display mt-7 text-[clamp(2.8rem,7vw,6.4rem)]">
            Web design
            <br />
            <span className="text-muted">& development</span>
          </h1>
          <p className="mt-7 max-w-[620px] text-[18px] leading-relaxed text-muted">
            Projektuję i koduję strony internetowe, sklepy, identyfikacje wizualne i interfejsy aplikacji. Jedna osoba od pomysłu do publikacji — dla firm z całej Polski.
          </p>
          <ul className="mt-16 border-t border-line">
            {offers.map((o, i) => (
              <FadeUp as="li" key={o.slug} delay={i * 0.05} y={16}>
                <TLink href={`/uslugi/${o.slug}`} label={o.name} className="group relative flex flex-col gap-3 border-b border-line py-8 sm:flex-row sm:items-center sm:gap-10 sm:py-10">
                  <span className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-gradient-to-r from-accent via-accent-2 to-transparent transition-transform duration-700 ease-out-expo group-hover:scale-x-100" />
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-line-2 text-muted transition-colors duration-500 group-hover:border-accent/50 group-hover:bg-accent/15 group-hover:text-accent-2">
                    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d={o.icon} />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <h2 className="h-display text-[clamp(1.8rem,3.6vw,3rem)] transition-colors duration-500 group-hover:text-accent-2">{o.h1}</h2>
                    <span className="mt-2 block max-w-[640px] text-[15.5px] leading-relaxed text-muted">{o.lead}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-4">
                    <span className="text-[14px] text-dim">{o.price ? `od ${o.price} zł` : "wycena indywidualna"}</span>
                    <span className="grid size-12 place-items-center rounded-full border border-line-2 transition-all duration-700 ease-out-expo group-hover:rotate-45 group-hover:border-transparent group-hover:bg-accent group-hover:text-white">
                      <Arrow className="size-4" />
                    </span>
                  </span>
                </TLink>
              </FadeUp>
            ))}
          </ul>
          <FadeUp className="mt-20">
            <Heading className="text-[clamp(2rem,4vw,3.4rem)]" lines={["Nie wiesz, czego potrzebujesz?", <span key="2" className="text-muted">Opisz projekt — doradzę.</span>]} />
            <div className="mt-8">
              <TLink href="/#kontakt" label="Kontakt" className="group btn btn-primary">
                <span className="roll">
                  <span>Wyceń projekt</span>
                  <span aria-hidden>Wyceń projekt</span>
                </span>
                <span className="dot">
                  <Arrow />
                  <Arrow />
                </span>
              </TLink>
            </div>
          </FadeUp>
        </section>
      </main>
      <Footer />
    </>
  );
}
