"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react";

/*
 * Ilustracje etapów procesu — małe, zapętlone sceny (grają tylko, gdy są na ekranie).
 */

const ease = [0.16, 1, 0.3, 1] as const;

// odtwarza scenę od nowa co `ms`, gdy widoczna
function useLoop(ms: number) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-15% 0px" });
  const [k, setK] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setK((x) => x + 1), ms);
    return () => clearInterval(t);
  }, [inView, ms]);
  return { ref, k, inView };
}

/* ---------- 1. Rozmowa: rozmowa wideo + notatki ---------- */

export function TalkArt() {
  const { ref, k, inView } = useLoop(7000);
  return (
    <div ref={ref} className="absolute inset-0 p-5 sm:p-7">
      {inView && (
        <div key={k} className="grid h-full grid-cols-[1.1fr_1fr] gap-3">
          <div className="flex flex-col gap-3">
            {[
              { n: "Ty", c: "from-[#d98b5f] to-[#8a4b2c]", d: 0.2 },
              { n: "af.", c: "from-accent to-[#4b34b8]", d: 0.4 },
            ].map((p, i) => (
              <motion.div key={p.n} className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-line bg-white/[0.03]" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: p.d, duration: 0.7, ease }}>
                <span className={`grid size-12 place-items-center rounded-full bg-gradient-to-br text-[14px] font-medium text-white ${p.c}`}>{p.n}</span>
                {/* fala dźwięku */}
                <span className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-end gap-[3px]">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <motion.span
                      key={j}
                      className={`w-[3px] rounded-full ${i ? "bg-accent-2" : "bg-white/60"}`}
                      animate={{ height: [4, 6 + ((j * 7 + i * 5) % 14), 4] }}
                      transition={{ repeat: Infinity, duration: 0.5 + (j % 3) * 0.15, delay: j * 0.06 + i * 1.6, repeatDelay: i ? 0.2 : 1.2, ease: "easeInOut" }}
                      style={{ height: 4 }}
                    />
                  ))}
                </span>
                <span className="absolute top-2.5 left-3 flex items-center gap-1.5 text-[10.5px] text-white/60">
                  <span className="size-1.5 animate-pulse rounded-full bg-red-400" />
                  {i ? "afto.works" : "Klient"}
                </span>
              </motion.div>
            ))}
          </div>
          <motion.div className="flex flex-col rounded-2xl border border-line bg-bg/60 p-4" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.8, ease }}>
            <p className="text-[11px] text-dim">Notatki z rozmowy</p>
            <ul className="mt-3 space-y-2.5 text-[12px]">
              {["Cel: więcej rezerwacji", "Klienci: 25–40 lat", "Budżet ustalony", "Termin: 3 tygodnie"].map((t, i) => (
                <motion.li key={t} className="flex items-center gap-2" initial={{ opacity: 0.25 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 + i * 0.9 }}>
                  <motion.span className="grid size-4 shrink-0 place-items-center rounded-full border" initial={{ borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(139,108,255,0)" }} animate={{ borderColor: "#8b6cff", backgroundColor: "#8b6cff" }} transition={{ delay: 1.2 + i * 0.9, duration: 0.3 }}>
                    <svg width="8" height="8" viewBox="0 0 10 10" aria-hidden>
                      <motion.path d="M2 5.2l2 2 4-4.4" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.3 + i * 0.9, duration: 0.3 }} />
                    </svg>
                  </motion.span>
                  {t}
                </motion.li>
              ))}
            </ul>
            <motion.div className="mt-auto rounded-xl bg-accent/15 px-3 py-2 text-[11.5px] text-accent-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 5, duration: 0.6, ease }}>
              Wycena wysłana ✓
            </motion.div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ---------- 2. Kierunek: wachlarz kolorów + typografia ---------- */

const fan = ["#efe9ff", "#b4a2ff", "#8b6cff", "#4b34b8", "#1a1426"];

export function DirectionArt() {
  const { ref, k, inView } = useLoop(8000);
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      {inView && (
        <div key={k} className="absolute inset-0">
          {/* wachlarz próbników */}
          <div className="absolute bottom-[-8%] left-[30%] h-[85%] w-[34%]">
            {fan.map((c, i) => (
              <motion.div
                key={c}
                className="absolute inset-0 origin-[50%_92%] rounded-2xl border border-white/10 p-3 shadow-[0_20px_40px_-15px_rgb(0_0_0/0.7)]"
                style={{ background: c }}
                initial={{ rotate: 0, y: 40, opacity: 0 }}
                animate={{ rotate: (i - 2) * 13, y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.09, type: "spring", stiffness: 120, damping: 14 }}
              >
                <span className={`block text-[10px] ${i < 2 ? "text-black/60" : "text-white/70"}`}>{c.toUpperCase()}</span>
              </motion.div>
            ))}
          </div>
          {/* typografia — oddychająca grubość */}
          <motion.div className="absolute top-[12%] left-[7%]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8, ease }}>
            <motion.p className="text-[clamp(3.2rem,7vw,5rem)] leading-none tracking-[-0.05em]" animate={{ fontVariationSettings: ["'wght' 300", "'wght' 800", "'wght' 300"] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
              Aa
            </motion.p>
            <p className="mt-2 text-[11px] text-dim">Satoshi · 300 → 800</p>
          </motion.div>
          <motion.div className="absolute top-[14%] right-[6%] flex flex-col items-end gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
            {["Premium", "Minimalnie", "Ciepło"].map((t, i) => (
              <motion.span key={t} className={`rounded-full border px-2.5 py-1 text-[11px] ${i === 0 ? "border-accent bg-accent/20 text-accent-2" : "border-line-2 text-dim"}`} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.2 + i * 0.15, duration: 0.6, ease }}>
                {t}
              </motion.span>
            ))}
          </motion.div>
          {/* kursor wybiera kolor */}
          <motion.div className="absolute z-10" initial={{ left: "85%", top: "80%", opacity: 0 }} animate={{ left: ["85%", "52%", "52%"], top: ["80%", "30%", "30%"], opacity: 1 }} transition={{ delay: 2, duration: 2, times: [0, 0.7, 1], ease: "easeInOut" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <path d="M2 1.5l13 6.2-5.6 1.6L7 15z" fill="#efedf5" stroke="#07070a" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            <motion.span className="absolute -top-3 -left-3 size-10 rounded-full border border-accent-2" initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.4], opacity: [1, 0] }} transition={{ delay: 3.5, duration: 0.6 }} />
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ---------- 3. Projekt: makieta rysuje się sama ---------- */

export function DesignArt() {
  const { ref, k, inView } = useLoop(7500);
  const draw = (d: number) => ({ initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { delay: d, duration: 0.9, ease } });
  const fill = (d: number) => ({ initial: { fillOpacity: 0 }, animate: { fillOpacity: 1 }, transition: { delay: d, duration: 0.6 } });
  // obrys rysuje się, potem kształt wypełnia kolorem
  const both = (d: number, f: number) => ({
    initial: { pathLength: 0, opacity: 0, fillOpacity: 0 },
    animate: { pathLength: 1, opacity: 1, fillOpacity: 1 },
    transition: { pathLength: { delay: d, duration: 0.9, ease }, opacity: { delay: d, duration: 0.3 }, fillOpacity: { delay: f, duration: 0.6 } },
  });
  return (
    <div ref={ref} className="absolute inset-0">
      <div className="absolute inset-0 [background-image:radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)] [background-size:18px_18px]" />
      {inView && (
        <svg key={k} viewBox="0 0 400 300" className="absolute inset-0 size-full p-5" fill="none" aria-hidden>
          <motion.rect x="20" y="16" width="360" height="268" rx="14" stroke="rgba(255,255,255,0.25)" {...draw(0.1)} />
          <motion.rect x="36" y="32" width="328" height="22" rx="8" stroke="rgba(255,255,255,0.3)" fill="rgba(255,255,255,0.05)" {...draw(0.4)} />
          <motion.rect x="46" y="40" width="40" height="6" rx="3" fill="#efedf5" {...fill(1)} />
          {[260, 286, 312].map((x, i) => (
            <motion.rect key={x} x={x} y="41" width="20" height="4" rx="2" fill={i === 2 ? "#8b6cff" : "rgba(255,255,255,0.4)"} {...fill(1.1 + i * 0.1)} />
          ))}
          <motion.rect x="46" y="80" width="150" height="16" rx="5" stroke="rgba(255,255,255,0.3)" fill="#efedf5" {...both(0.8, 2.6)} />
          <motion.rect x="46" y="102" width="110" height="16" rx="5" stroke="rgba(255,255,255,0.3)" fill="#b4a2ff" {...both(0.95, 2.75)} />
          <motion.rect x="46" y="132" width="64" height="20" rx="10" stroke="rgba(255,255,255,0.3)" fill="#8b6cff" {...both(1.1, 2.9)} />
          <motion.rect x="218" y="74" width="146" height="100" rx="12" stroke="rgba(255,255,255,0.3)" {...draw(1.2)} />
          <motion.path d="M218 174L364 74M218 74l146 100" stroke="rgba(255,255,255,0.12)" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 3 }} />
          <motion.rect x="218" y="74" width="146" height="100" rx="12" fill="url(#g-design)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3, duration: 0.8 }} />
          {[46, 152, 258].map((x, i) => (
            <motion.rect key={x} x={x} y="196" width="96" height="70" rx="10" stroke="rgba(255,255,255,0.22)" fill="rgba(255,255,255,0.04)" {...draw(1.4 + i * 0.12)} />
          ))}
          {/* zaznaczenie przycisku */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ delay: 1.9, duration: 2.6, times: [0, 0.1, 0.85, 1] }}>
            <rect x="42" y="128" width="72" height="28" stroke="#8b6cff" strokeWidth="1.2" />
            {[
              [42, 128],
              [114, 128],
              [42, 156],
              [114, 156],
            ].map(([x, y]) => (
              <rect key={`${x}${y}`} x={x - 3} y={y - 3} width="6" height="6" fill="#fff" stroke="#8b6cff" />
            ))}
            <rect x="56" y="162" width="44" height="13" rx="3" fill="#8b6cff" />
            <text x="78" y="171.5" textAnchor="middle" fontSize="8" fill="#fff" fontFamily="var(--font-satoshi)">
              64 × 20
            </text>
          </motion.g>
          <defs>
            <linearGradient id="g-design" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#c9b8ff" />
              <stop offset="1" stopColor="#4b34b8" />
            </linearGradient>
          </defs>
        </svg>
      )}
      {inView && (
        <motion.div key={`c${k}`} className="absolute z-10" initial={{ left: "80%", top: "85%" }} animate={{ left: ["80%", "22%", "26%", "60%"], top: ["85%", "48%", "48%", "40%"] }} transition={{ duration: 4.5, times: [0, 0.35, 0.55, 1], ease: "easeInOut", delay: 1 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            <path d="M2 1.5l13 6.2-5.6 1.6L7 15z" fill="#efedf5" stroke="#07070a" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          <span className="ml-3 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-medium text-white">afto</span>
        </motion.div>
      )}
    </div>
  );
}

/* ---------- 4. Wdrożenie: licznik do 100 i start ---------- */

function Ring({ delay }: { delay: number }) {
  const v = useMotionValue(0);
  const txt = useTransform(v, (x) => Math.round(x));
  const len = useTransform(v, (x) => x / 100);
  useEffect(() => {
    const c = animate(v, 100, { delay, duration: 2.2, ease: [0.65, 0, 0.35, 1] });
    return () => c.stop();
  }, [v, delay]);
  return (
    <div className="relative grid size-[120px] place-items-center sm:size-[140px]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r="44" stroke="rgba(255,255,255,0.08)" strokeWidth="5" fill="none" />
        <motion.circle cx="50" cy="50" r="44" stroke="url(#g-ring)" strokeWidth="5" fill="none" strokeLinecap="round" style={{ pathLength: len }} />
        <defs>
          <linearGradient id="g-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8b6cff" />
            <stop offset="1" stopColor="#6ee7b7" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-center">
        <motion.span className="h-display block text-[38px] leading-none tabular-nums">{txt}</motion.span>
        <span className="text-[10.5px] text-dim">Wydajność</span>
      </span>
    </div>
  );
}

export function LaunchArt() {
  const { ref, k, inView } = useLoop(7000);
  const url = "twojafirma.pl";
  return (
    <div ref={ref} className="absolute inset-0">
      {inView && (
        <div key={k} className="absolute inset-0 flex flex-col p-5 sm:p-7">
          <motion.div className="flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3 py-2" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            <motion.span className="size-2 rounded-full" initial={{ backgroundColor: "#615e6e" }} animate={{ backgroundColor: "#34d399", boxShadow: "0 0 10px #34d399" }} transition={{ delay: 3.2 }} />
            <span className="text-[12px] text-muted">
              https://
              {url.split("").map((c, i) => (
                <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.06 }} className="text-ink">
                  {c}
                </motion.span>
              ))}
            </span>
          </motion.div>
          <div className="relative flex flex-1 items-center justify-center gap-6">
            <Ring delay={0.8} />
            <div className="space-y-2 text-[12px]">
              {["SSL", "SEO", "Analityka", "Formularz"].map((t, i) => (
                <motion.p key={t} className="flex items-center gap-2 text-muted" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 + i * 0.4, duration: 0.5 }}>
                  <span className="text-emerald-300">✓</span>
                  {t}
                </motion.p>
              ))}
            </div>
            {/* konfetti */}
            {Array.from({ length: 14 }).map((_, i) => {
              const a = (i / 14) * Math.PI * 2;
              return (
                <motion.span
                  key={i}
                  className="absolute top-1/2 left-1/2 size-1.5 rounded-full"
                  style={{ background: ["#8b6cff", "#b4a2ff", "#6ee7b7", "#efedf5"][i % 4] }}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{ x: Math.cos(a) * (90 + (i % 3) * 30), y: Math.sin(a) * (70 + (i % 4) * 18), opacity: [0, 1, 0], scale: [0, 1, 0.6] }}
                  transition={{ delay: 3.1, duration: 1.4, ease: "easeOut" }}
                />
              );
            })}
          </div>
          <motion.div className="mx-auto flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-[13px] text-emerald-200" initial={{ opacity: 0, scale: 0.6, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 3.1, type: "spring", stiffness: 300, damping: 18 }}>
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400" />
              <span className="relative size-2 rounded-full bg-emerald-400" />
            </span>
            Strona jest online
          </motion.div>
        </div>
      )}
    </div>
  );
}
