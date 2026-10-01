import Link from "next/link";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { site } from "@/lib/site";
import { CookieButton, LegalToc } from "./LegalToc";

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
  return (
    <>
      <Navbar />
      <main className="relative overflow-x-clip">
        <div className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[min(900px,100vw)] bg-[radial-gradient(closest-side,rgb(139_108_255/0.1),transparent)]" aria-hidden />
        <div className="relative mx-auto max-w-[1320px] px-5 pt-40 pb-28 sm:px-8">
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

          <h1 className="h-display mt-10 text-[clamp(2.8rem,6vw,5.4rem)]">{title}</h1>
          <p className="mt-5 max-w-[640px] text-[17px] leading-relaxed text-muted">{intro}</p>
          <p className="mt-4 text-[13.5px] text-dim">Obowiązuje od: {updated}</p>

          <div className="edge mt-12 grid gap-6 rounded-[28px] bg-surface p-6 sm:p-8 lg:grid-cols-[220px_1fr]">
            <p className="text-[15px] text-ink">W skrócie</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {summary.map((s) => (
                <li key={s} className="flex gap-3 text-[15px] leading-relaxed text-muted">
                  <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-accent" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-[260px_1fr] lg:gap-20">
            <LegalToc items={sections.map((s, i) => ({ id: `s${i + 1}`, label: s.title, n: i + 1 }))} />

            <div className="min-w-0">
              {sections.map((s, i) => (
                <section key={s.title} id={`s${i + 1}`} className="scroll-mt-28 border-t border-line py-10 first:border-t-0 first:pt-0">
                  <h2 className="flex items-baseline gap-4 text-[clamp(1.5rem,2.4vw,2rem)] font-medium tracking-[-0.025em]">
                    <span className="text-[15px] font-normal text-accent-2 tabular-nums">§ {i + 1}</span>
                    {s.title}
                  </h2>
                  <ol className="mt-6 space-y-4">
                    {s.items.map((it, j) => (
                      <li key={j} className="grid grid-cols-[28px_1fr] text-[16px] leading-[1.75] text-muted">
                        <span className="text-dim tabular-nums">{j + 1}.</span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ol>
                  {s.table && (
                    <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
                      <table className="w-full min-w-[560px] text-left text-[14px]">
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
              ))}

              <div className="edge mt-6 flex flex-col justify-between gap-6 rounded-[28px] bg-surface p-6 sm:flex-row sm:items-center sm:p-8">
                <div>
                  <p className="text-[17px]">Masz pytania?</p>
                  <p className="mt-1 text-[14px] text-muted">
                    {owner} · {street}, {city}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={`mailto:${site.email}`} className="rounded-full bg-ink px-4 py-2.5 text-[14px] font-medium text-bg transition-colors hover:bg-white">
                    {site.email}
                  </a>
                  <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="rounded-full border border-line-2 px-4 py-2.5 text-[14px] transition-colors hover:border-white/40">
                    {site.phone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
