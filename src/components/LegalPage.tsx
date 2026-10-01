import Link from "next/link";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { site } from "@/lib/site";

export type LegalSection = { title: string; items: string[] };

export default function LegalPage({ index, title, sections }: { index: string; title: string; sections: LegalSection[] }) {
  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden px-4 pt-40 pb-28 sm:px-5">
        <div
          className="grid-lines pointer-events-none absolute inset-x-0 top-0 h-[70vh] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_30%,transparent_100%)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[900px] -translate-x-1/2 rounded-full bg-sel/15 blur-[120px]" aria-hidden />

        <article className="relative mx-auto max-w-3xl">
          <Link href="/" className="group inline-flex items-center gap-2 font-mono text-[11px] text-muted transition-colors hover:text-ink">
            <span className="transition-transform duration-500 ease-out-expo group-hover:-translate-x-1">←</span> Wróć na stronę główną
          </Link>
          <p className="mt-12 font-mono text-[11px] tracking-wide text-muted uppercase">{index}</p>
          <h1 className="text-silver mt-4 font-display text-5xl leading-none font-medium tracking-[-0.05em] sm:text-7xl">{title}</h1>
          <p className="mt-5 text-sm text-muted">
            Ostatnia aktualizacja: {site.legal.updated} · {site.domain}
          </p>

          <div className="mt-14 space-y-4">
            {sections.map((s, i) => (
              <section key={s.title} className="hairline surface rounded-3xl p-6 sm:p-8">
                <h2 className="flex items-baseline gap-3 font-display text-xl font-medium tracking-[-0.02em] sm:text-2xl">
                  <span className="font-mono text-xs text-sel">§{i + 1}</span>
                  {s.title}
                </h2>
                <ol className="mt-5 list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted marker:font-mono marker:text-xs marker:text-dim">
                  {s.items.map((it, j) => (
                    <li key={j} className="pl-1">
                      {it}
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
