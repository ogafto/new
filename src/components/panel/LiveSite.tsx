"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { checkSite } from "@/app/panel/cms/actions";
import { Icon } from "./kit";

/*
 * Strona klienta na żywo: prawdziwa strona w ramce (widok komputera skalowany do szerokości albo telefon),
 * odświeżana sama po każdym zapisie w edytorze (zdarzenie „afto:cms-saved”).
 */
export default function LiveSite({ siteId, href, tall = false }: { siteId: string; href: string; tall?: boolean }) {
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const [n, setN] = useState(0);
  const [flash, setFlash] = useState(false);
  const [state, setState] = useState<{ ok: boolean; frame?: boolean } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    let alive = true;
    checkSite(siteId).then((r) => alive && setState(r)).catch(() => alive && setState({ ok: false }));
    return () => {
      alive = false;
    };
  }, [siteId]);

  // zapis w edytorze → po chwili (strona odświeża treści) przeładuj podgląd
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const on = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        setN((x) => x + 1);
        setFlash(true);
        setTimeout(() => setFlash(false), 1800);
      }, 1200);
    };
    addEventListener("afto:cms-saved", on);
    return () => {
      clearTimeout(t);
      removeEventListener("afto:cms-saved", on);
    };
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = tall ? 760 : 620;
  const scale = device === "desktop" && w ? Math.min(1, w / 1280) : 1;
  const blocked = state?.frame === false;

  return (
    <section className="overflow-hidden rounded-[22px] bg-surface ring-1 ring-white/[0.05] ring-inset">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5 sm:px-4">
        <span className="flex items-center gap-2 text-[13px]">
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
            <span className="relative size-2 rounded-full bg-emerald-400" />
          </span>
          Na żywo
        </span>
        <span className="hidden min-w-0 flex-1 truncate rounded-full bg-white/[0.04] px-3 py-1 text-center text-[12px] text-muted sm:block">{href.replace(/^https?:\/\//, "")}</span>
        <span className="ml-auto flex items-center gap-1 sm:ml-0">
          <span className="flex rounded-full bg-white/[0.05] p-0.5">
            {(["desktop", "phone"] as const).map((d) => (
              <button key={d} type="button" onClick={() => setDevice(d)} className={`grid h-8 w-9 place-items-center rounded-full transition-colors ${device === d ? "bg-white/[0.12] text-ink" : "text-dim hover:text-ink"}`} aria-label={d === "desktop" ? "Widok komputera" : "Widok telefonu"}>
                <Icon d={d === "desktop" ? "M3 5h18v11H3zM8 20h8M12 16v4" : "M8 3h8a1 1 0 011 1v16a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1zM11 18h2"} className="size-4" />
              </button>
            ))}
          </span>
          <button type="button" onClick={() => setN((x) => x + 1)} className="grid size-8 place-items-center rounded-full text-dim hover:bg-white/[0.06] hover:text-ink" aria-label="Odśwież podgląd">
            <Icon d="M20 11a8 8 0 00-14.9-3.9M4 4v4h4M4 13a8 8 0 0014.9 3.9M20 20v-4h-4" className="size-4" />
          </button>
          <a href={href} target="_blank" rel="noopener noreferrer" className="grid size-8 place-items-center rounded-full text-dim hover:bg-white/[0.06] hover:text-ink" aria-label="Otwórz w nowej karcie">
            <Icon d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" className="size-4" />
          </a>
        </span>
      </div>

      <div ref={box} className="relative overflow-hidden bg-[#0b0b0f]" style={{ height: H }}>
        <AnimatePresence>
          {flash && (
            <motion.span initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-emerald-400/90 px-3 py-1 text-[12.5px] font-medium text-[#04110b] shadow-lg">
              Zaktualizowano ✓
            </motion.span>
          )}
        </AnimatePresence>
        {blocked ? (
          <div className="grid h-full place-items-center p-6 text-center">
            <div>
              <p className="text-[15px]">Ta strona nie pozwala pokazać się w podglądzie</p>
              <p className="mt-1 text-[13px] text-dim">Otwórz ją w nowej karcie, zmiany są tam od razu po zapisaniu.</p>
              <a href={href} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex h-10 items-center rounded-full bg-ink px-5 text-[13.5px] font-medium text-bg">
                Otwórz stronę ↗
              </a>
            </div>
          </div>
        ) : device === "desktop" ? (
          <iframe key={`d${n}`} src={href} title="Podgląd strony" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" className="absolute top-0 left-0 origin-top-left border-0 bg-white" style={{ width: 1280, height: H / scale, transform: `scale(${scale})` }} />
        ) : (
          <div className="flex h-full items-center justify-center py-4">
            <div className="h-full max-h-[720px] w-[360px] overflow-hidden rounded-[34px] border-[6px] border-[#1d1d24] bg-white shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)]">
              <iframe key={`p${n}`} src={href} title="Podgląd strony na telefonie" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" className="h-full w-full border-0" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
