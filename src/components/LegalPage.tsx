import Link from "next/link";
import Navbar from "./Navbar";
import Footer from "./Footer";
import JsonLd from "./JsonLd";
import { site } from "@/lib/site";
import { CookieButton, LegalToc, LegalTocMobile, ReadingProgress } from "./LegalToc";
import { FadeUp } from "./ui/Reveal";

export type LegalSection = {
  title: string;
  items: string[];
  table?: { head: string[]; rows: string[][] };
};

const docs = [
  { href: "/regulamin", label: "Regulamin" },
  { href: "/polityka-prywatnosci", label: "Polityka prywatności" },
];

export default function LegalPage({ title, intro, summary, sections, current }: { title: string; intro: string; summary: string[]; sections: LegalSection[]; current: string }) {
  const { owner, street, city, updated } = site.legal;
  const toc = sections.map((s, i) => ({ id: `s${i + 1}`, label: s.title, n: i + 1 }));
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Strona główna", item: site.url },
            { "@type": "ListItem", position: 2, name: title, item: `${site.url}${current}` },
          ],
        }}
      />
      <ReadingProgress />
      <Navbar />
      <main className="relative overflow-x-clip">
        <div className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[min(900px,100vw)] bg-[radial-gradient(closest-side,rgb(139_108_255/0.1),transparent)]" aria-hidden />
        <div className="relative mx-auto max-w-[1240px] px-5 pt-36 pb-28 sm:px-8 sm:pt-40">
          {/* nagłówek */}
          <FadeUp>
            <nav aria-label="Dokumenty" className="flex flex-wrap items-center gap-2">
              {docs.map((d) => (
                <Link
                  key={d.href}
                  href={d.href}
                  aria-current={current === d.href ? "page" : undefined}
                  className={`rounded-full px-4 py-2 text-[13.5px] transition-colors ${current === d.href ? "bg-white/[0.08] text-ink" : "border border-line text-muted hover:text-ink"}`}
                >
                  {d.label}
                </Link>
              ))}
              <CookieButton />
            </nav>
          </FadeUp>
          <h1 className="h-display mt-10 text-[clamp(2.8rem,7vw,5.6rem)]">{title}</h1>
          <div>
            <p className="mt-5 max-w-[620px] text-[17px] leading-relaxed text-muted">{intro}</p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[12.5px] text-dim">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Obowiązuje od {updated}
            </p>
          </div>

          {/* w skrócie */}
          <FadeUp delay={0.15} className="mt-14">
            <p className="text-[13px] text-dim">W skrócie</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {summary.map((s) => (
                <li key={s} className="edge flex gap-3 rounded-2xl bg-surface p-5 text-[15px] leading-relaxed text-muted">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent/20 text-accent-2">
                    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                      <path d="M2 5.2l2 2 4-4.4" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </FadeUp>

          {/* treść */}
          <div className="mt-20 grid gap-12 lg:grid-cols-[240px_1fr] lg:gap-20">
            <LegalToc items={toc} />
            <div className="min-w-0 max-w-[720px]">
              <LegalTocMobile items={toc} />
              {sections.map((s, i) => (
                <FadeUp key={s.title} y={16}>
                  <section id={`s${i + 1}`} className="scroll-mt-28 border-t border-line py-10 first:border-t-0 first:pt-0 sm:py-12">
                    <div className="flex items-center gap-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full border border-accent/30 bg-accent/10 text-[13px] text-accent-2 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                      <h2 className="text-[clamp(1.4rem,2.6vw,1.9rem)] font-medium tracking-[-0.025em]">{s.title}</h2>
                    </div>
                    <ol className="mt-6 space-y-4 sm:pl-14">
                      {s.items.map((it, j) => (
                        <li key={j} className="grid grid-cols-[2.25rem_1fr] text-[15.5px] leading-[1.75] text-muted sm:text-[16px]">
                          <span className="text-[13px] leading-[1.9] text-dim tabular-nums">
                            {i + 1}.{j + 1}
                          </span>
                          <span>{it}</span>
                        </li>
                      ))}
                    </ol>
                    {s.table && (
                      <div className="mt-6 overflow-x-auto rounded-2xl border border-line sm:ml-14" data-lenis-prevent>
                        <table className="w-full min-w-[520px] text-left text-[14px]">
                          <thead className="bg-white/[0.03] text-[12.5px] text-dim">
                            <tr>
                              {s.table.head.map((h) => (
                                <th key={h} className="px-4 py-3 font-normal">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line">
                            {s.table.rows.map((r) => (
                              <tr key={r[0]}>
                                {r.map((c, k) => (
                                  <td key={k} className={`px-4 py-3 align-top ${k === 0 ? "font-mono text-[13px] text-ink" : "text-muted"}`}>
                                    {c}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </FadeUp>
              ))}

              <FadeUp>
                <div className="edge mt-6 flex flex-col justify-between gap-6 rounded-[28px] bg-surface p-6 sm:flex-row sm:items-center sm:p-8">
                  <div>
                    <p className="text-[17px]">Masz pytania?</p>
                    <p className="mt-1 text-[14px] text-muted">
                      {owner} · {street}, {city}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={`mailto:${site.email}`} className="max-w-full truncate rounded-full bg-ink px-4 py-2.5 text-[14px] font-medium text-bg transition-colors hover:bg-white">
                      Napisz e-mail
                    </a>
                    <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="rounded-full border border-line-2 px-4 py-2.5 text-[14px] transition-colors hover:border-white/40">
                      {site.phone}
                    </a>
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
