import Navbar from "./Navbar";
import Footer from "./Footer";
import { Section } from "./ui/Line";
import { site } from "@/lib/site";

export type LegalSection = { title: string; items: string[] };

export default function LegalPage({ title, sections }: { title: string; sections: LegalSection[] }) {
  return (
    <>
      <Navbar />
      <div className="mx-3 border-x border-line pt-14 sm:mx-6 2xl:mx-auto 2xl:max-w-[1440px]">
        <main>
          <Section index="—" label="Dokumenty">
            <div className="grid lg:grid-cols-4">
              <div className="border-line p-4 sm:p-6 lg:col-span-3 lg:border-r">
                <h1 className="display text-[clamp(3rem,9vw,8rem)]">{title}</h1>
              </div>
              <div className="label flex items-end border-t border-line p-4 text-muted sm:p-6 lg:border-t-0">
                Aktualizacja: {site.legal.updated}
              </div>
            </div>
            {sections.map((s, i) => (
              <div key={s.title} className="grid border-t border-line lg:grid-cols-4">
                <div className="border-line p-4 sm:p-6 lg:border-r">
                  <p className="label text-accent">§ {String(i + 1).padStart(2, "0")}</p>
                  <h2 className="mt-3 font-display text-[22px] leading-tight font-semibold uppercase [font-stretch:85%]">{s.title}</h2>
                </div>
                <ol className="list-decimal space-y-3 p-4 pl-10 text-[16px] leading-relaxed text-muted marker:font-mono marker:text-[12px] marker:text-dim sm:p-6 sm:pl-12 lg:col-span-3">
                  {s.items.map((it, j) => (
                    <li key={j} className="pl-1">
                      {it}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </Section>
        </main>
        <Footer />
      </div>
    </>
  );
}
