"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { serviceName, type Project } from "@/lib/site";
import Button from "../ui/Button";
import Tile from "./Tile";

const ease = [0.16, 1, 0.3, 1] as const;

export function orderService(id: string) {
  window.dispatchEvent(new CustomEvent("afto:service", { detail: id }));
}

export default function ProjectDrawer({ list, index, onClose, onNav }: { list: Project[]; index: number | null; onClose: () => void; onNav: (i: number) => void }) {
  const lenis = useLenis();
  const p = index !== null ? list[index] : null;

  useEffect(() => {
    if (index === null) return;
    lenis?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNav((index + 1) % list.length);
      if (e.key === "ArrowLeft") onNav((index - 1 + list.length) % list.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start();
    };
  }, [index, list.length, onClose, onNav, lenis]);

  return (
    <AnimatePresence>
      {p && index !== null && (
        <>
          <motion.div key="overlay" className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label={p.name}
            className="fixed inset-y-2 right-2 z-[61] flex w-[calc(100%-16px)] max-w-[880px] flex-col overflow-hidden rounded-[28px] border border-line bg-surface"
            initial={{ x: "105%" }}
            animate={{ x: 0 }}
            exit={{ x: "105%" }}
            transition={{ duration: 0.8, ease }}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5 sm:px-7">
              <span className="text-[14px] text-muted">
                {String(index + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => onNav((index - 1 + list.length) % list.length)} className="grid size-10 place-items-center rounded-full border border-line-2 transition-colors hover:bg-white/5" aria-label="Poprzednia realizacja">
                  ←
                </button>
                <button type="button" onClick={() => onNav((index + 1) % list.length)} className="grid size-10 place-items-center rounded-full border border-line-2 transition-colors hover:bg-white/5" aria-label="Następna realizacja">
                  →
                </button>
                <button type="button" onClick={onClose} className="ml-2 h-10 rounded-full bg-ink px-4 text-[14px] font-medium text-bg" autoFocus>
                  Zamknij
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain" data-lenis-prevent>
              <AnimatePresence mode="wait">
                <motion.div key={p.slug} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="p-5 sm:p-7">
                  <Tile p={p} className="aspect-[16/11] w-full" />
                  <p className="mt-2 text-[13px] text-dim">Najedź na podgląd, żeby przewinąć projekt.</p>

                  <div className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
                    <div>
                      <p className="eyebrow">{serviceName(p.category)}</p>
                      <h3 className="h-display mt-4 text-[clamp(2.6rem,6vw,4.5rem)]">{p.name}</h3>
                      <p className="mt-5 text-[18px] leading-relaxed text-muted">{p.description}</p>
                    </div>
                    <dl className="divide-y divide-line border-y border-line text-[15px]">
                      {[
                        ["Klient", p.client],
                        ["Rok", p.year],
                        ["Zakres", p.scope.join(", ")],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-6 py-4">
                          <dt className="text-dim">{k}</dt>
                          <dd className="text-right">{v}</dd>
                        </div>
                      ))}
                      <div className="flex items-center justify-between py-4">
                        <dt className="text-dim">Kolory</dt>
                        <dd className="flex gap-1.5">
                          {p.palette.map((c) => (
                            <span key={c} title={c} className="size-6 rounded-full ring-1 ring-white/15" style={{ background: c }} />
                          ))}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-[20px] bg-surface-2 p-6 sm:flex-row sm:items-center">
                    <p className="text-[17px]">
                      Chcesz coś podobnego? <span className="text-muted">Wycena w 24 godziny.</span>
                    </p>
                    <Button
                      onClick={() => {
                        orderService(p.category);
                        onClose();
                        setTimeout(() => lenis?.scrollTo("#kontakt", { offset: -72, duration: 1.4 }), 60);
                      }}
                    >
                      Zamów podobny projekt
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
