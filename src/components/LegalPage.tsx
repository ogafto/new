import Link from "next/link";
import { site } from "@/lib/site";
import Mark from "./chrome/Mark";

export type LegalSection = { title: string; items: string[] };

// Dokument jako biała ramka A4 na płótnie.
export default function LegalPage({ title, sections }: { title: string; sections: LegalSection[] }) {
  return (
    <div className="canvas-dots min-h-screen px-3 pt-3 pb-24 sm:px-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="ui-panel flex h-12 items-center gap-2.5 pr-4 pl-1.5 text-[13px] hover:bg-black/[0.02]">
          <Mark className="size-8" />
          <span className="font-semibold">{site.domain}</span>
          <span className="text-black/40">/ {title}</span>
        </Link>
        <Link href="/" className="ui-btn-blue">
          ← Wróć do pliku
        </Link>
      </header>

      <div className="mx-auto mt-16 max-w-[820px]">
        <div className="mb-2 flex justify-between font-ui text-[11px] text-muted">
          <span className="text-sel">{title}</span>
          <span className="font-mono">A4 · 210 × 297</span>
        </div>
        <article className="bg-white px-6 py-12 shadow-[0_1px_3px_rgb(0_0_0/0.08)] sm:px-16 sm:py-20">
          <p className="font-ui text-[13px] text-muted">
            {site.domain} · aktualizacja: {site.legal.updated}
          </p>
          <h1 className="mt-4 font-display text-5xl leading-none font-semibold tracking-[-0.045em] sm:text-7xl" style={{ fontStretch: "106%" }}>
            {title}
          </h1>
          <div className="mt-14 space-y-12">
            {sections.map((s, i) => (
              <section key={s.title} className="grid gap-4 sm:grid-cols-[80px_1fr]">
                <span className="font-mono text-[13px] text-sel">§ {i + 1}</span>
                <div>
                  <h2 className="font-display text-2xl font-semibold tracking-[-0.03em]">{s.title}</h2>
                  <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-[16px] leading-relaxed text-black/70 marker:font-mono marker:text-[12px] marker:text-black/35">
                    {s.items.map((it, j) => (
                      <li key={j} className="pl-1">
                        {it}
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
