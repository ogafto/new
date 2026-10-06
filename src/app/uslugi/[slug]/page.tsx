import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { TLink } from "@/components/Transition";
import { FadeUp, Heading } from "@/components/ui/Reveal";
import { ProjectCard } from "@/components/work/AllWork";
import { Faq, OrderButton } from "@/components/offer/OfferParts";
import { cities, offerBySlug, offers } from "@/lib/offer";
import { getProjects } from "@/lib/projects";
import { site, steps } from "@/lib/site";
import { loadContent } from "@/lib/content-server";

export function generateStaticParams() {
  return offers.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const o = offerBySlug((await params).slug);
  if (!o) return {};
  const url = `/uslugi/${o.slug}`;
  return {
    title: o.title,
    description: o.description,
    keywords: o.keywords,
    alternates: { canonical: url },
    openGraph: { title: `${o.title} | ${site.domain}`, description: o.description, url, images: ["/opengraph-image"] },
    twitter: { card: "summary_large_image", title: o.title, description: o.description },
  };
}

export default async function OfferPage({ params }: { params: Promise<{ slug: string }> }) {
  await loadContent();
  const o = offerBySlug((await params).slug);
  if (!o) notFound();
  const projects = o.service ? (await getProjects()).filter((p) => p.category === o.service).slice(0, 4) : [];
  const url = `${site.url}/uslugi/${o.slug}`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: o.h1,
        serviceType: o.name,
        description: o.description,
        url,
        provider: { "@id": `${site.url}/#business` },
        areaServed: [{ "@type": "Country", name: "Polska" }, ...cities.map((c) => ({ "@type": "City", name: c }))],
        availableChannel: { "@type": "ServiceChannel", serviceUrl: `${site.url}/#kontakt`, availableLanguage: "pl" },
        ...(o.price ? { offers: { "@type": "Offer", priceCurrency: "PLN", price: o.price, priceSpecification: { "@type": "PriceSpecification", minPrice: o.price, priceCurrency: "PLN" } } } : {}),
      },
      {
        "@type": "FAQPage",
        mainEntity: o.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Strona główna", item: site.url },
          { "@type": "ListItem", position: 2, name: "Usługi", item: `${site.url}/uslugi` },
          { "@type": "ListItem", position: 3, name: o.name, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={schema} />
      <Navbar />
      <main className="relative overflow-x-clip">
        <div className="pointer-events-none absolute -top-40 right-0 h-[700px] w-[min(1000px,100vw)] bg-[radial-gradient(closest-side,rgb(139_108_255/0.12),transparent)]" aria-hidden />

        {/* hero */}
        <section className="relative mx-auto max-w-[1400px] px-5 pt-36 pb-20 sm:px-10 sm:pt-44 lg:pb-28">
          <nav aria-label="Okruszki" className="flex flex-wrap items-center gap-2 text-[13px] text-dim">
            <TLink href="/" label="Strona główna" className="link-u hover:text-ink">
              Strona główna
            </TLink>
            <span>/</span>
            <TLink href="/uslugi" label="Usługi" className="link-u hover:text-ink">
              Usługi
            </TLink>
            <span>/</span>
            <span className="text-muted">{o.name}</span>
          </nav>
          <div className="mt-10 grid items-end gap-10 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <p className="kicker">Web designer & developer</p>
              <h1 className="h-display mt-7 text-[clamp(2.8rem,7vw,6.4rem)]">{o.h1}</h1>
              <p className="mt-7 max-w-[600px] text-[18px] leading-relaxed text-muted">{o.lead}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <OrderButton service={o.service} />
                <TLink href="/portfolio" label="Portfolio" className="group btn btn-outline">
                  <span className="roll">
                    <span>Zobacz realizacje</span>
                    <span aria-hidden>Zobacz realizacje</span>
                  </span>
                </TLink>
              </div>
            </div>
            <FadeUp delay={0.15}>
              <dl className="edge grid grid-cols-2 gap-px overflow-hidden rounded-[24px] bg-line">
                {[
                  ["Cena", o.price ? `od ${o.price} zł` : "wycena indywidualna"],
                  ["Czas", o.time ?? "do ustalenia"],
                  ["Współpraca", "zdalnie, cała Polska"],
                  ["Panel klienta", "w cenie"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-surface p-5">
                    <dt className="text-[12.5px] text-dim">{k}</dt>
                    <dd className="mt-1.5 text-[17px] tracking-[-0.01em]">{v}</dd>
                  </div>
                ))}
              </dl>
            </FadeUp>
          </div>
        </section>

        {/* co dostajesz */}
        <section className="mx-auto max-w-[1400px] px-5 pb-24 sm:px-10 lg:pb-32">
          <FadeUp>
            <p className="kicker">Zakres</p>
          </FadeUp>
          <Heading className="mt-7 text-[clamp(2.2rem,4.6vw,4rem)]" lines={["Co dostajesz", <span key="2" className="text-muted">w ramach usługi</span>]} />
          <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {o.includes.map((it, i) => (
              <FadeUp as="li" key={it.title} delay={(i % 3) * 0.06} y={20} className="edge group h-full rounded-[22px] bg-surface p-6 transition-colors duration-500 hover:bg-surface-2">
                  <span className="grid size-10 place-items-center rounded-xl bg-accent/15 text-[13px] text-accent-2 tabular-nums transition-transform duration-500 ease-out-expo group-hover:-rotate-6">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-5 text-[19px] font-medium tracking-[-0.015em]">{it.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{it.text}</p>
                </FadeUp>
            ))}
          </ul>
        </section>

        {/* dla kogo + gdzie */}
        <section className="mx-auto grid max-w-[1400px] gap-14 px-5 pb-24 sm:px-10 lg:grid-cols-2 lg:pb-32">
          <div>
            <FadeUp>
              <p className="kicker">Dla kogo</p>
            </FadeUp>
            <ul className="mt-8 space-y-3">
              {o.forWho.map((f, i) => (
                <FadeUp as="li" key={f} delay={i * 0.05} y={14} className="flex items-center gap-4 border-b border-line pb-3 text-[18px] tracking-[-0.01em]">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent/20 text-accent-2">
                      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                        <path d="M2 5.2l2 2 4-4.4" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {f}
                  </FadeUp>
              ))}
            </ul>
          </div>
          <FadeUp delay={0.1}>
            <div className="edge h-full rounded-[28px] bg-surface p-7 sm:p-9">
              <p className="kicker">Obszar działania</p>
              <h2 className="h-display mt-6 text-[clamp(1.8rem,3vw,2.6rem)]">Pracuję zdalnie z firmami z całej Polski</h2>
              <p className="mt-4 text-[15.5px] leading-relaxed text-muted">
                Rozmawiamy telefonicznie, przez Discorda lub wideo, a postęp projektu śledzisz w panelu klienta. Realizuję projekty m.in. dla klientów z miast:
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {cities.map((c) => (
                  <li key={c} className="rounded-full border border-line-2 px-3 py-1.5 text-[13px] text-muted">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </FadeUp>
        </section>

        {/* proces */}
        <section className="mx-auto max-w-[1400px] px-5 pb-24 sm:px-10 lg:pb-32">
          <FadeUp>
            <p className="kicker">Proces</p>
          </FadeUp>
          <Heading className="mt-7 text-[clamp(2.2rem,4.6vw,4rem)]" lines={["Jak wygląda", <span key="2" className="text-muted">współpraca</span>]} />
          <ol className="mt-12 grid gap-px overflow-hidden rounded-[24px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="bg-bg p-6 sm:p-7">
                <span className="text-[13px] text-accent-2 tabular-nums">0{i + 1}</span>
                <h3 className="mt-4 text-[22px] font-medium tracking-[-0.02em]">{s.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{s.lead}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* realizacje */}
        {projects.length > 0 && (
          <section className="mx-auto max-w-[1400px] px-5 pb-24 sm:px-10 lg:pb-32">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <FadeUp>
                  <p className="kicker">Realizacje</p>
                </FadeUp>
                <Heading className="mt-7 text-[clamp(2.2rem,4.6vw,4rem)]" lines={["Wybrane projekty"]} />
              </div>
              <TLink href="/portfolio" label="Portfolio" className="link-u text-[15px] text-muted hover:text-ink">
                Całe portfolio →
              </TLink>
            </div>
            <ul className="mt-12 grid gap-x-6 gap-y-12 md:grid-cols-2">
              {projects.map((p, i) => (
                <FadeUp as="li" key={p.slug} delay={(i % 2) * 0.08}>
                    <ProjectCard p={p} />
                  </FadeUp>
              ))}
            </ul>
          </section>
        )}

        {/* FAQ */}
        <section className="mx-auto grid max-w-[1400px] gap-12 px-5 pb-24 sm:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:pb-32">
          <div>
            <FadeUp>
              <p className="kicker">FAQ</p>
            </FadeUp>
            <Heading className="mt-7 text-[clamp(2.2rem,4.6vw,4rem)]" lines={["Częste", <span key="2" className="text-muted">pytania</span>]} />
          </div>
          <Faq items={o.faq} />
        </section>

        {/* CTA + inne usługi */}
        <section className="mx-auto max-w-[1400px] px-5 pb-28 sm:px-10">
          <FadeUp>
            <div className="edge relative overflow-hidden rounded-[32px] bg-surface p-8 text-center sm:p-14">
              <div className="pointer-events-none absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.2),transparent)]" aria-hidden />
              <h2 className="h-display relative text-[clamp(2.2rem,5vw,4.4rem)]">
                Porozmawiajmy o <span className="text-accent-2">Twoim projekcie.</span>
              </h2>
              <p className="relative mx-auto mt-5 max-w-[480px] text-[16.5px] text-muted">Krótka rozmowa, konkretna wycena i termin. Bez zobowiązań.</p>
              <div className="relative mt-8 flex justify-center">
                <OrderButton service={o.service} />
              </div>
            </div>
          </FadeUp>
          <div className="mt-16">
            <p className="text-[13px] text-dim">Inne usługi</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {offers
                .filter((x) => x.slug !== o.slug)
                .map((x) => (
                  <li key={x.slug}>
                    <TLink href={`/uslugi/${x.slug}`} label={x.name} className="inline-flex rounded-full border border-line-2 px-4 py-2.5 text-[14px] text-muted transition-colors hover:border-white/35 hover:text-ink">
                      {x.name}
                    </TLink>
                  </li>
                ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
