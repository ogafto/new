"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { serviceName, type Project } from "@/lib/site";
import Button from "../ui/Button";

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
          <motion.div key="overlay" className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label={p.name}
            className="edge fixed inset-y-3 right-3 z-[61] flex w-[calc(100%-24px)] max-w-[900px] flex-col overflow-hidden rounded-[26px] bg-surface"
            initial={{ x: "110%" }}
            animate={{ x: 0 }}
            exit={{ x: "110%" }}
            transition={{ duration: 0.9, ease }}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-6">
              <span className="text-[13px] text-dim tabular-nums">
                {String(index + 1).padStart(2, "0")} — {String(list.length).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-2">
                {[
                  ["←", "Poprzednia", (index - 1 + list.length) % list.length],
                  ["→", "Następna", (index + 1) % list.length],
                ].map(([sym, label, to]) => (
                  <button key={label as string} type="button" onClick={() => onNav(to as number)} aria-label={`${label} realizacja`} className="grid size-10 place-items-center rounded-full border border-line-2 text-muted transition-colors hover:border-white/40 hover:text-ink">
                    {sym}
                  </button>
                ))}
                <button type="button" onClick={onClose} className="ml-2 h-10 rounded-full border border-line-2 px-4 text-[14px] transition-colors hover:border-white/40" autoFocus>
                  Zamknij
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain" data-lenis-prevent>
              <AnimatePresence mode="wait">
                <motion.div key={p.slug} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease }} className="p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={`${p.name} — ${p.client}`} className="aspect-[4/3] w-full rounded-[18px] object-cover" />

                  <div className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
                    <div>
                      <p className="kicker">{serviceName(p.category)}</p>
                      <h3 className="h-display mt-5 text-[clamp(2.8rem,6vw,4.8rem)]">{p.name}</h3>
                      <p className="mt-6 text-[17px] leading-relaxed text-muted">{p.description}</p>
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
                        <dt className="text-dim">Paleta</dt>
                        <dd className="flex gap-1.5">
                          {p.palette.map((c) => (
                            <span key={c} title={c} className="size-6 rounded-full ring-1 ring-white/15" style={{ background: c }} />
                          ))}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-12 flex flex-col items-start justify-between gap-5 border-t border-line pt-8 sm:flex-row sm:items-center">
                    <p className="h-display text-[26px] tracking-[-0.03em]">Chcesz coś podobnego?</p>
                    <Button
                      onClick={() => {
                        orderService(p.category);
                        onClose();
                        setTimeout(() => lenis?.scrollTo("#kontakt", { offset: -80, duration: 1.4 }), 60);
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
