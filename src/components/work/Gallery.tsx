"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import type { Work } from "@/lib/projects";
import { useLoaded } from "../Providers";
import { TLink, useCovering } from "../Transition";
import Media from "../ui/Media";

/*
 * Kategoria portfolio: „Wróć na stronę główną”, nazwa kategorii i prace jedno pod drugim,
 * od marginesu do marginesu, z odstępem i lekkim zaokrągleniem. Zdjęcia, GIF-y i wideo.
 * Kliknięcie powiększa pracę na cały ekran (płynnie z miejsca, w którym była);
 * strzałki / klawiatura / przesunięcie palcem przechodzą dalej, Esc lub klik w tło zamyka.
 * Kolejność jak w panelu: nowe prace dochodzą na dół.
 */

const ease = [0.16, 1, 0.3, 1] as const;
const pad = (n: number) => String(n).padStart(2, "0");

type Shot = { key: string; id?: string; src: string; w?: number; h?: number; alt: string };

// praca = plik główny + ewentualne kolejne zdjęcia (prace dodane wcześniej z galerią)
const shots = (works: Work[]): Shot[] =>
  works.flatMap((w) => [
    { key: w.id, id: `praca-${w.slug}`, src: w.image, w: w.w, h: w.h, alt: w.description ? `${w.name}: ${w.description.slice(0, 120)}` : w.name },
    ...w.gallery.map((g, i) => ({ key: `${w.id}-${i}`, src: g, alt: `${w.name}, zdjęcie ${i + 2}` })),
  ]);

function Title({ text, show }: { text: string; show: boolean }) {
  let k = 0;
  return (
    <h1 className="h-display text-[clamp(2.4rem,5.2vw,4.6rem)] leading-[0.95] tracking-[-0.045em]" aria-label={text}>
      {text.split(" ").map((word, wi) => (
        <span key={wi} className="mr-[0.22em] inline-block overflow-hidden pb-[0.1em] align-top last:mr-0" aria-hidden>
          {[...word].map((ch) => {
            const d = k++;
            return (
              <motion.span key={d} className="inline-block" initial={{ y: "110%" }} animate={show ? { y: "0%" } : {}} transition={{ delay: 0.15 + d * 0.03, duration: 1, ease }}>
                {ch}
              </motion.span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

const slide = {
  enter: (d: number) => ({ x: d === 0 ? 0 : d > 0 ? "12%" : "-12%", opacity: 0, scale: d === 0 ? 1 : 0.96 }),
  center: { x: "0%", opacity: 1, scale: 1 },
  exit: (d: number) => ({ x: d > 0 ? "-10%" : d < 0 ? "10%" : 0, opacity: 0, scale: 0.96 }),
};

function Lightbox({ list, index, dir, shared, go, onClose }: { list: Shot[]; index: number; dir: number; shared: string | null; go: (d: 1 | -1) => void; onClose: () => void }) {
  const s = list[index];
  const n = list.length;
  const ratio = s.w && s.h ? s.w / s.h : 16 / 9;

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && n > 1) go(1);
      else if (e.key === "ArrowLeft" && n > 1) go(-1);
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [go, onClose, n]);

  const arrow = "group absolute top-1/2 z-10 hidden size-14 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-md transition-colors hover:border-white hover:bg-white hover:text-bg sm:grid";

  return (
    <motion.div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={s.alt}>
      <motion.div className="absolute inset-0 bg-[rgb(6_6_9/0.96)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease }} onClick={onClose} />

      <motion.div className="absolute inset-x-0 top-0 z-10 flex h-16 items-center justify-between px-4 pt-[env(safe-area-inset-top)] sm:h-20 sm:px-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-[13px] text-white/50 tabular-nums">
          {n > 1 && (
            <>
              <span className="text-white">{pad(index + 1)}</span> / {pad(n)}
            </>
          )}
        </p>
        <button type="button" onClick={onClose} className="group grid size-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white hover:text-bg" aria-label="Zamknij (Esc)">
          <svg viewBox="0 0 24 24" className="size-5 transition-transform duration-500 ease-out-expo group-hover:rotate-90" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </motion.div>

      <AnimatePresence initial={false} custom={dir} mode="popLayout">
        <motion.div
          key={s.key}
          custom={dir}
          variants={slide}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease }}
          drag={n > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.5}
          onDragEnd={(_, info) => {
            if (info.offset.x < -70 || info.velocity.x < -500) go(1);
            else if (info.offset.x > 70 || info.velocity.x > 500) go(-1);
          }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
          className="absolute inset-0 grid place-items-center px-3 pt-16 pb-6 sm:px-24 sm:pt-20 sm:pb-10"
        >
          <motion.div
            layoutId={shared === s.key ? `shot-${s.key}` : undefined}
            className="relative overflow-hidden rounded-[10px] sm:rounded-[14px]"
            style={{ aspectRatio: `${ratio}`, width: `min(100%, calc((100svh - 130px) * ${ratio}))` }}
            transition={{ layout: { duration: 0.6, ease } }}
          >
            <Media src={s.src} alt={s.alt} fill sizes="100vw" quality={90} className="object-contain" loading="eager" />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {n > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} className={`${arrow} left-4`} aria-label="Poprzednie">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </button>
          <button type="button" onClick={() => go(1)} className={`${arrow} right-4`} aria-label="Następne">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </>
      )}
    </motion.div>
  );
}

export default function Gallery({ category }: { category: { name: string; works: Work[] } }) {
  const loaded = useLoaded();
  const covering = useCovering();
  const show = loaded && !covering;
  const lenis = useLenis();
  const list = shots(category.works);
  const [view, setView] = useState<{ i: number; dir: number; shared: string | null } | null>(null);

  // podgląd otwarty: strona pod spodem stoi, a gdy przełączasz prace, przewija się do aktualnej (zamknięcie wraca do niej)
  const current = view ? list[view.i]?.key : null;
  useEffect(() => {
    if (!current) return;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    const el = document.getElementById(`shot-${current}`);
    if (el && lenis) {
      const r = el.getBoundingClientRect();
      if (r.top < 80 || r.bottom > window.innerHeight) lenis.scrollTo(el, { offset: -Math.max(80, (window.innerHeight - r.height) / 2), immediate: true, force: true });
    }
    return () => {
      document.documentElement.style.overflow = "";
      lenis?.start();
    };
  }, [current, lenis]);

  const go = useCallback((d: 1 | -1) => setView((v) => (v ? { i: (v.i + d + list.length) % list.length, dir: d, shared: null } : v)), [list.length]);
  const close = useCallback(() => setView(null), []);

  return (
    <main className="relative overflow-x-clip">
      <section className="mx-auto max-w-[1400px] px-5 pt-28 sm:px-10 sm:pt-36">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={show ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9, ease }}>
          <TLink href="/" label="Strona główna" className="group inline-flex items-center gap-4 rounded-full border border-line-2 py-1.5 pr-6 pl-1.5 text-[15px] text-muted transition-colors duration-500 hover:border-white/30 hover:text-ink">
            <span className="grid size-10 place-items-center rounded-full bg-white/[0.08] text-ink transition-transform duration-500 ease-out-expo group-hover:-translate-x-0.5">
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M19 12H5M11 6l-6 6 6 6" />
              </svg>
            </span>
            Wróć na stronę główną
          </TLink>
        </motion.div>

        <div className="mt-8 sm:mt-10">
          <Title text={category.name} show={show} />
        </div>
      </section>

      <section aria-label="Prace" className="mx-auto flex max-w-[1400px] flex-col gap-4 px-5 pt-8 pb-20 sm:gap-6 sm:px-10 sm:pt-12 sm:pb-28">
        {list.map((s, i) => (
          <motion.figure
            key={s.key}
            id={s.id}
            className="relative scroll-mt-24"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -6% 0px" }}
            transition={{ duration: 1.1, ease }}
          >
            <button type="button" onClick={() => setView({ i, dir: 0, shared: s.key })} className="block w-full cursor-zoom-in" aria-label={`Powiększ: ${s.alt}`}>
              <motion.div id={`shot-${s.key}`} layoutId={`shot-${s.key}`} className="overflow-hidden rounded-[10px] bg-surface sm:rounded-[14px]" transition={{ layout: { duration: 0.6, ease } }}>
                <Media src={s.src} alt={s.alt} w={s.w} h={s.h} sizes="(min-width: 1400px) 1320px, 100vw" quality={90} loading={i < 2 ? "eager" : "lazy"} className="block h-auto w-full" />
              </motion.div>
            </button>
          </motion.figure>
        ))}
      </section>

      <AnimatePresence>{view && <Lightbox key="lightbox" list={list} index={view.i} dir={view.dir} shared={view.shared} go={go} onClose={close} />}</AnimatePresence>
    </main>
  );
}
