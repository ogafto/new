import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth/session";
import { getSite, siteHref } from "@/lib/cms";
import { loadCollections } from "@/lib/cms-load";
import { Icon, PageHead } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import SiteWorkspace from "@/components/panel/client/SiteWorkspace";

export const metadata: Metadata = { title: "Moja strona" };

const STEPS = [
  ["Wybierz część strony", "np. Baner, Oferta albo FAQ."],
  ["Zmień albo dodaj", "tekst, zdjęcie, cenę — obok widzisz stronę na żywo."],
  ["Kliknij „Zapisz zmiany”", "i gotowe — zmiana jest na stronie od razu."],
];

export default async function ClientSite({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const site = await getSite((await params).id);
  if (!site || (!isAdmin(user) && site.owner_id !== user.id)) notFound();
  const collections = await loadCollections(site.id);
  const href = siteHref(site.domain);
  return (
    <>
      <PageHead title={site.name} />
      <section className="relative mb-4 overflow-hidden rounded-[26px] bg-surface p-6 ring-1 ring-white/[0.05] ring-inset sm:p-7">
        <div className="pointer-events-none absolute -top-40 -left-32 size-[460px] rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.28),transparent)]" aria-hidden />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-[12.5px] text-emerald-200">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" /> Zmiany widoczne od razu
            </span>
            <h1 className="mt-4 text-[clamp(1.9rem,3.6vw,2.8rem)] leading-tight font-medium tracking-[-0.03em]">{site.name}</h1>
            {href && <p className="mt-1 text-[14.5px] text-muted">{href.replace(/^https?:\/\//, "")}</p>}
          </div>
          {href && (
            <a href={href} target="_blank" rel="noopener noreferrer" className="group flex h-12 items-center gap-3 self-start rounded-full bg-ink pr-1.5 pl-5 text-[14.5px] font-medium text-bg transition-colors hover:bg-white lg:self-auto">
              Otwórz stronę
              <span className="grid size-9 place-items-center rounded-full bg-accent text-white transition-transform duration-500 group-hover:rotate-45">
                <Icon d={ICONS.arrowUp} className="size-4 rotate-45" />
              </span>
            </a>
          )}
        </div>
        <ol className="relative mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-3">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent/20 text-[12.5px] text-accent-2">{i + 1}</span>
              <span>
                <span className="block text-[14px]">{t}</span>
                <span className="block text-[12.5px] text-dim">{d}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
      {!collections.some((c) => c.entries.some((e) => Object.values(e.data ?? {}).some((v) => v !== null && v !== "" && v !== false))) && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl bg-accent/[0.08] p-4 ring-1 ring-accent/20 ring-inset">
          <span className="relative mt-0.5 flex size-2.5 shrink-0">
            <span className="absolute inset-0 animate-ping rounded-full bg-accent-2/70" />
            <span className="relative size-2.5 rounded-full bg-accent-2" />
          </span>
          <p className="text-[14px] leading-relaxed text-muted">
            <span className="text-ink">Strona jest właśnie podłączana do panelu.</span> Za chwilę zobaczysz tu wszystkie jej treści gotowe do edycji — nic nie musisz robić.
          </p>
        </div>
      )}
      <SiteWorkspace siteId={site.id} href={href} collections={collections} />
    </>
  );
}
