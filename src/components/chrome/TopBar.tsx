"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { frames } from "@/lib/frames";
import { site } from "@/lib/site";
import { useCanvas } from "../canvas/CanvasProvider";
import { useLoaded } from "../Providers";
import Mark from "./Mark";
import Tip from "./Tip";

export default function TopBar() {
  const { active, goTo, goToId, mode } = useCanvas();
  const loaded = useLoaded();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <motion.header
      className="pointer-events-none fixed inset-x-3 top-3 z-50 flex items-start justify-between gap-3"
      initial={{ opacity: 0, y: -12 }}
      animate={loaded ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.2, duration: 0.6 }}
    >
      <div ref={box} className="ui-panel pointer-events-auto relative flex h-12 items-center gap-1 pr-2 pl-1.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-9 items-center gap-2.5 rounded-md pr-2 pl-1 hover:bg-black/[0.04]"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Warstwy i nawigacja"
        >
          <Mark className="size-8" />
          <span className="text-[13px] font-semibold">{site.domain}</span>
          <span className="hidden text-[13px] text-black/40 sm:inline">/ Portfolio 2026</span>
          <svg width="10" height="10" viewBox="0 0 10 10" className={`text-black/50 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
            <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" fill="none" />
          </svg>
        </button>

        <AnimatePresence>
          {open && (
            <motion.nav
              role="menu"
              className="ui-panel absolute top-[calc(100%+8px)] left-0 w-[280px] p-1.5 text-[13px]"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              style={{ transformOrigin: "0 0" }}
            >
              <p className="px-2.5 pt-1.5 pb-2 text-[11px] font-medium text-black/45">Warstwy</p>
              {frames.map((f, i) => (
                <button
                  key={f.id}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    goTo(i);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left ${
                    active === i ? "bg-sel/10 text-ink" : "text-[#2c2c2e] hover:bg-black/[0.04]"
                  } ${f.id.startsWith("projekt-") ? "pl-7" : ""}`}
                >
                  <span className={`font-mono text-[11px] ${active === i ? "text-sel" : "text-black/35"}`}>#</span>
                  {f.id.startsWith("projekt-") ? f.name.replace("Projekt — ", "") : f.name}
                  {active === i && <span className="ml-auto size-1.5 rounded-full bg-sel" />}
                </button>
              ))}
              <div className="my-1.5 h-px bg-black/[0.07]" />
              <Link role="menuitem" href="/regulamin" className="block rounded-md px-2.5 py-1.5 text-[#2c2c2e] hover:bg-black/[0.04]">
                Regulamin
              </Link>
              <Link role="menuitem" href="/polityka-prywatnosci" className="block rounded-md px-2.5 py-1.5 text-[#2c2c2e] hover:bg-black/[0.04]">
                Polityka prywatności
              </Link>
              {mode === "canvas" && (
                <p className="mt-1.5 border-t border-black/[0.07] px-2.5 pt-2 pb-1 text-[11px] text-black/40">← → przełączaj ramki · ⇧1 cały plik · C komentarz</p>
              )}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>

      <div className="ui-panel pointer-events-auto flex h-12 items-center gap-2.5 pr-1.5 pl-2.5">
        <div className="hidden items-center -space-x-1.5 sm:flex">
          <span className="group relative">
            <span className="grid size-7 place-items-center rounded-full bg-sel font-ui text-[10px] font-semibold text-white ring-2 ring-white">Ty</span>
            <Tip label="To Ty — witaj w pliku" side="bottom" />
          </span>
          <span className="group relative">
            <span className="grid size-7 place-items-center rounded-full bg-ink font-ui text-[11px] font-semibold text-white ring-2 ring-white">
              {site.brand[0].toUpperCase()}
            </span>
            <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-ok ring-2 ring-white" />
            <Tip label={`${site.brand} — dostępny`} side="bottom" />
          </span>
        </div>
        <button type="button" onClick={() => goToId("kontakt")} className="ui-btn-blue">
          Napisz do mnie
        </button>
      </div>
    </motion.header>
  );
}
