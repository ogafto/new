import Navbar from "./Navbar";
import Footer from "./Footer";
import { site } from "@/lib/site";

export type LegalSection = { title: string; items: string[] };

export default function LegalPage({ title, sections }: { title: string; sections: LegalSection[] }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-[1320px] px-5 pt-40 pb-28 sm:px-8">
        <p className="kicker">Dokumenty</p>
        <h1 className="h-display mt-6 text-[clamp(2.8rem,6vw,5.4rem)]">{title}</h1>
        <p className="mt-4 text-[15px] text-muted">Aktualizacja: {site.legal.updated}</p>

        <div className="mt-16 divide-y divide-line border-y border-line">
          {sections.map((s, i) => (
            <section key={s.title} className="grid gap-4 py-10 lg:grid-cols-[1fr_2fr] lg:gap-12">
              <h2 className="h-display text-[24px] tracking-[-0.02em]">
                <span className="mr-3 text-dim">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </h2>
              <ol className="list-decimal space-y-3 pl-5 text-[16px] leading-relaxed text-muted marker:text-dim">
                {s.items.map((it, j) => (
                  <li key={j} className="pl-1">
                    {it}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
