"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { serviceName, type Project } from "@/lib/site";
import { LineButton } from "../ui/Line";
import ProjectThumb from "./ProjectThumb";

const ease = [0.76, 0, 0.24, 1] as const;

export function orderService(id: string) {
  window.dispatchEvent(new CustomEvent("afto:service", { detail: id }));
}

export default function ProjectDrawer({
  list,
  index,
  onClose,
  onNav,
}: {
  list: Project[];
  index: number | null;
  onClose: () => void;
  onNav: (i: number) => void;
}) {
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
          <motion.div
            key="overlay"
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label={p.name}
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-[940px] flex-col border-l border-line bg-bg"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.8, ease }}
          >
            <div className="flex h-14 shrink-0 items-stretch border-b border-line">
              <span className="label flex items-center px-4 text-muted sm:px-6">
                <span className="text-accent">{String(index + 1).padStart(2, "0")}</span>&nbsp;/ {String(list.length).padStart(2, "0")}
              </span>
              <div className="flex-1" />
              <button type="button" onClick={() => onNav((index - 1 + list.length) % list.length)} className="label border-l border-line px-4 hover:text-accent sm:px-5" aria-label="Poprzednia praca">
                ←
              </button>
              <button type="button" onClick={() => onNav((index + 1) % list.length)} className="label border-l border-line px-4 hover:text-accent sm:px-5" aria-label="Następna praca">
                →
              </button>
              <button type="button" onClick={onClose} className="label border-l border-line px-4 hover:text-accent sm:px-6" autoFocus>
                Zamknij ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain" data-lenis-prevent>
              <AnimatePresence mode="wait">
                <motion.div key={p.slug} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                  <div className="group/mock border-b border-line p-4 sm:p-6">
                    <ProjectThumb p={p} className="aspect-[16/10] w-full" />
                    <p className="label mt-3 text-dim">Najedź na podgląd, żeby przewinąć stronę</p>
                  </div>

                  <div className="grid lg:grid-cols-[1.25fr_1fr]">
                    <div className="border-line p-4 sm:p-6 lg:border-r">
                      <p className="label text-muted">{serviceName(p.category)}</p>
                      <h3 className="display mt-3 text-[clamp(3rem,9vw,6.5rem)]">{p.name}</h3>
                      <p className="mt-6 max-w-md text-[18px] leading-relaxed text-muted">{p.description}</p>
                    </div>
                    <dl className="border-t border-line lg:border-t-0">
                      {[
                        ["Klient", p.client],
                        ["Rok", p.year],
                        ["Usługa", serviceName(p.category)],
                        ["Zakres", p.scope.join(" · ")],
                      ].map(([k, v]) => (
                        <div key={k} className="grid grid-cols-[110px_1fr] border-b border-line px-4 py-4 sm:px-6">
                          <dt className="label text-dim">{k}</dt>
                          <dd className="text-[15px]">{v}</dd>
                        </div>
                      ))}
                      <div className="grid grid-cols-4">
                        {p.palette.map((c, i) => (
                          <div key={c} className={`border-line ${i < 3 ? "border-r" : ""}`}>
                            <div className="h-16" style={{ background: c }} />
                            <p className="label px-3 py-2 text-dim">{c}</p>
                          </div>
                        ))}
                      </div>
                    </dl>
                  </div>

                  <div className="border-t border-line">
                    <LineButton
                      className="h-16 w-full text-[17px]"
                      onClick={() => {
                        orderService(p.category);
                        onClose();
                        setTimeout(() => lenis?.scrollTo("#kontakt", { offset: -56, duration: 1.4 }), 50);
                      }}
                    >
                      Zamów podobny projekt
                    </LineButton>
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
