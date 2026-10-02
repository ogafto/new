"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { content } from "@/lib/content";
import { useLoaded } from "./Providers";
import { TLink } from "./Transition";

// Pasek ogłoszeń z panelu (Treści strony → Ogłoszenie) — pływająca kapsuła na dole, do zamknięcia
export default function Announcement() {
  const a = content().announcement;
  const loaded = useLoaded();
  const path = usePathname();
  const key = `afto:notice:${a.text}`;
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!a.enabled || !loaded || /^\/(konto|panel)/.test(path)) return;
    let closed = false;
    try {
      closed = localStorage.getItem(key) === "1";
    } catch {}
    if (closed) return;
    const t = setTimeout(() => setShow(true), 2200);
    return () => clearTimeout(t);
  }, [a.enabled, loaded, path, key]);

  const close = () => {
    setShow(false);
    try {
      localStorage.setItem(key, "1");
    } catch {}
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-[60] flex justify-center sm:bottom-6"
          initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 30, filter: "blur(6px)" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          role="status"
        >
          <div className="edge relative flex max-w-full items-center gap-3 overflow-hidden rounded-full bg-surface/90 py-1.5 pr-1.5 pl-4 text-[13.5px] shadow-[0_30px_60px_-20px_rgb(0_0_0/0.9),0_0_40px_-10px_rgb(139_108_255/0.35)] backdrop-blur-xl">
            <motion.span className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent" initial={{ x: "-150%" }} animate={{ x: "900%" }} transition={{ delay: 1, duration: 2.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 5 }} />
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inset-0 animate-ping rounded-full bg-accent-2/70" />
              <span className="relative size-2 rounded-full bg-accent-2" />
            </span>
            <span className="min-w-0 truncate">{a.text}</span>
            {a.label && a.link && (
              <TLink href={a.link} label={a.label} onClick={close} className="shrink-0 rounded-full bg-ink px-3.5 py-1.5 text-[12.5px] font-medium text-bg transition-colors hover:bg-white">
                {a.label}
              </TLink>
            )}
            <button type="button" onClick={close} className="grid size-8 shrink-0 place-items-center rounded-full text-dim transition-colors hover:bg-white/5 hover:text-ink" aria-label="Zamknij ogłoszenie">
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
