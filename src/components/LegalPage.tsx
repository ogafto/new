import Link from "next/link";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { site } from "@/lib/site";

export type LegalSection = { title: string; items: string[] };

export default function LegalPage({ index, title, sections }: { index: string; title: string; sections: LegalSection[] }) {
  return (
    <>
      <Navbar />
      <main className="canvas-dots min-h-screen px-5 pt-36 pb-24">
        <article className="mx-auto max-w-3xl">
          <Link href="/" className="font-mono text-xs text-muted hover:text-sel">
            ← Wróć na stronę główną
          </Link>
          <p className="mt-10 font-mono text-xs text-muted">
            <span className="text-sel">#</span> {index}
          </p>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-tighter sm:text-7xl">{title}</h1>
          <p className="mt-4 text-sm text-muted">Ostatnia aktualizacja: {site.legal.updated}</p>

          <div className="mt-14 space-y-6">
            {sections.map((s, i) => (
              <section key={s.title} className="rounded-2xl border border-line bg-panel/70 p-6 backdrop-blur sm:p-8">
                <h2 className="flex items-baseline gap-3 font-display text-xl font-semibold tracking-tight sm:text-2xl">
                  <span className="font-mono text-xs text-sel">§{i + 1}</span>
                  {s.title}
                </h2>
                <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-[15px] leading-relaxed text-muted marker:font-mono marker:text-xs marker:text-white/30">
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
