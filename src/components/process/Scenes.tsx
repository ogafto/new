"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";

/*
 * Animowane „ekrany” dla etapów procesu. Każda scena gra od początku przy wejściu
 * (montowana na nowo przy zmianie etapu) i mieści się w oknie ok. 520 × 460.
 */

const ease = [0.16, 1, 0.3, 1] as const;
const pop = (delay: number) => ({ initial: { opacity: 0, y: 12, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { delay, duration: 0.7, ease } });

function Check({ delay, className = "" }: { delay: number; className?: string }) {
  return (
    <motion.span
      className={`grid size-5 shrink-0 place-items-center rounded-full ${className}`}
      initial={{ backgroundColor: "rgba(255,255,255,0)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }}
      animate={{ backgroundColor: "#8b6cff", boxShadow: "inset 0 0 0 1px rgba(139,108,255,1)" }}
      transition={{ delay, duration: 0.35 }}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <motion.path d="M2 5.2l2 2 4-4.4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: delay + 0.1, duration: 0.35 }} />
      </svg>
    </motion.span>
  );
}

function Cursor({ path, delay, duration, click, label }: { path: { x: string[]; y: string[] }; delay: number; duration: number; click?: number; label?: string }) {
  return (
    <motion.div
      className="pointer-events-none absolute top-0 left-0 z-20"
      initial={{ left: path.x[0], top: path.y[0], opacity: 0 }}
      animate={{ left: path.x, top: path.y, opacity: 1 }}
      transition={{ delay, duration, ease: [0.65, 0, 0.35, 1], opacity: { delay, duration: 0.3 } }}
    >
      <motion.svg width="18" height="18" viewBox="0 0 18 18" animate={click ? { scale: [1, 0.8, 1] } : {}} transition={{ delay: click, duration: 0.3 }}>
        <path d="M2 1.5l13 6.2-5.6 1.6L7 15z" fill="#efedf5" stroke="#07070a" strokeWidth="1.2" strokeLinejoin="round" />
      </motion.svg>
      {label && <span className="ml-3 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-white">{label}</span>}
    </motion.div>
  );
}

function Count({ to, delay }: { to: number; delay: number }) {
  const v = useMotionValue(0);
  const r = useTransform(v, (x) => Math.round(x));
  useEffect(() => {
    const c = animate(v, to, { delay, duration: 1.4, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [v, to, delay]);
  return <motion.span>{r}</motion.span>;
}

/* ---------- 1. Rozmowa ---------- */

const chat = [
  { me: false, text: "Cześć! Szukam kogoś do strony dla mojej palarni kawy." },
  { me: true, text: "Super. Kto dziś najczęściej u Was kupuje?" },
  { me: false, text: "Głównie stali klienci, ale chcemy sprzedawać online." },
  { me: true, text: "Zrobimy sklep z subskrypcją. Wycenę wyślę jeszcze dziś." },
];

export function TalkScene() {
  return (
    <div className="grid h-full gap-4 p-5 sm:grid-cols-[1.25fr_1fr] sm:p-7">
      <div className="flex flex-col justify-end gap-2.5">
        {chat.map((m, i) => {
          const d = 0.3 + i * 0.9;
          return (
            <div key={i} className={`flex flex-col ${m.me ? "items-end" : "items-start"}`}>
              {m.me && (
                <motion.span className="mb-1 flex gap-1 rounded-full bg-white/5 px-3 py-2" initial={{ opacity: 0, height: 0 }} animate={{ opacity: [0, 1, 1, 0], height: ["0px", "auto", "auto", "0px"] }} transition={{ delay: d - 0.55, duration: 0.6, times: [0, 0.1, 0.9, 1] }}>
                  {[0, 1, 2].map((k) => (
                    <motion.span key={k} className="size-1 rounded-full bg-muted" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8, delay: k * 0.15 }} />
                  ))}
                </motion.span>
              )}
              <motion.p
                {...pop(d)}
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug sm:text-[13.5px] ${m.me ? "rounded-br-md bg-accent text-white" : "rounded-bl-md border border-line bg-white/[0.04] text-ink"}`}
              >
                {m.text}
              </motion.p>
            </div>
          );
        })}
      </div>

      <motion.div {...pop(0.6)} className="hidden flex-col rounded-2xl border border-line bg-bg/60 p-4 sm:flex">
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-dim">Brief</p>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10.5px] text-muted">auto</span>
        </div>
        <ul className="mt-4 space-y-3 text-[12.5px]">
          {[
            ["Cel", "Sprzedaż online"],
            ["Klient", "Miłośnicy kawy"],
            ["Zakres", "Sklep + subskrypcje"],
            ["Termin", "3 tygodnie"],
          ].map(([k, v], i) => (
            <motion.li key={k} className="flex items-center gap-2.5" initial={{ opacity: 0.35 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 + i * 0.75, duration: 0.4 }}>
              <Check delay={1.2 + i * 0.75} />
              <span className="min-w-0">
                <span className="block text-[10.5px] text-dim">{k}</span>
                <span className="block truncate">{v}</span>
              </span>
            </motion.li>
          ))}
        </ul>
        <motion.div {...pop(4.4)} className="mt-auto rounded-xl border border-accent/30 bg-accent/10 px-3 py-2.5">
          <p className="text-[10.5px] text-accent-2">Wycena</p>
          <p className="text-[13px]">Wysłana · od 800 zł</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ---------- 2. Kierunek ---------- */

const styles = [
  { name: "Minimal", bg: "#e9e6df", fg: "#1c1b19", acc: "#c9a27a", font: "font-light" },
  { name: "Ciemny premium", bg: "#141019", fg: "#efe9ff", acc: "#8b6cff", font: "font-medium" },
  { name: "Organic", bg: "#2f3a2c", fg: "#efe6d2", acc: "#d98b5f", font: "italic" },
];
const palette = ["#141019", "#2a2140", "#8b6cff", "#c9b8ff", "#efe9ff"];

export function DirectionScene() {
  const pick = 3.1;
  return (
    <div className="relative flex h-full flex-col gap-4 p-5 sm:p-7">
      <div className="grid flex-1 grid-cols-3 gap-2.5 sm:gap-3">
        {styles.map((s, i) => {
          const chosen = i === 1;
          return (
            <motion.div
              key={s.name}
              {...pop(0.25 + i * 0.18)}
              className="relative flex flex-col overflow-hidden rounded-2xl"
              style={{ background: s.bg, color: s.fg }}
            >
              <motion.div
                className="pointer-events-none absolute inset-0 z-10 rounded-2xl"
                initial={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)", opacity: 1 }}
                animate={chosen ? { boxShadow: "inset 0 0 0 2px #8b6cff" } : { opacity: 1 }}
                transition={{ delay: pick + 0.15, duration: 0.4 }}
              />
              <motion.div className="flex flex-1 flex-col p-3 sm:p-4" animate={chosen ? {} : { opacity: 0.35 }} transition={{ delay: pick + 0.2, duration: 0.6 }}>
                <span className={`text-[26px] leading-none sm:text-[34px] ${s.font}`}>Aa</span>
                <span className="mt-3 block h-1.5 w-4/5 rounded-full" style={{ background: s.fg, opacity: 0.7 }} />
                <span className="mt-1.5 block h-1.5 w-3/5 rounded-full" style={{ background: s.fg, opacity: 0.35 }} />
                <span className="mt-auto block h-5 w-12 rounded-full" style={{ background: s.acc }} />
              </motion.div>
              <p className="border-t border-current/10 px-3 py-2 text-[10.5px] opacity-70 sm:px-4">{s.name}</p>
              {chosen && (
                <motion.span
                  className="absolute top-2.5 right-2.5 z-20 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-white"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: pick + 0.25, duration: 0.5, ease }}
                >
                  Wybrany
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
        <motion.div {...pop(3.8)} className="rounded-2xl border border-line bg-bg/60 p-3.5">
          <p className="text-[10.5px] text-dim">Paleta</p>
          <div className="mt-2.5 flex gap-1.5">
            {palette.map((c, i) => (
              <motion.span key={c} className="h-9 flex-1 rounded-lg ring-1 ring-white/10" style={{ background: c }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 4 + i * 0.1, duration: 0.6, ease }} />
            ))}
          </div>
        </motion.div>
        <motion.div {...pop(4.3)} className="hidden rounded-2xl border border-line bg-bg/60 p-3.5 sm:block">
          <p className="text-[10.5px] text-dim">Typografia</p>
          <p className="mt-1.5 text-[24px] leading-none font-medium tracking-[-0.03em]">Satoshi</p>
          <p className="mt-1 text-[11px] text-muted">500 · 400 · ‑4% tracking</p>
        </motion.div>
      </div>

      <Cursor path={{ x: ["85%", "60%", "50%"], y: ["90%", "45%", "30%"] }} delay={1.6} duration={1.4} click={pick} />
    </div>
  );
}

/* ---------- 3. Projekt ---------- */

const layers = ["Strona główna", "Nawigacja", "Hero", "Przycisk", "Zdjęcie"];

export function DesignScene() {
  const fill = 3.6;
  return (
    <div className="flex h-full">
      <motion.aside {...pop(0.2)} className="hidden w-[132px] shrink-0 border-r border-line p-3.5 sm:block">
        <p className="text-[10.5px] text-dim">Warstwy</p>
        <ul className="mt-3 space-y-1 text-[11.5px]">
          {layers.map((l, i) => (
            <motion.li
              key={l}
              className={`rounded-md px-2 py-1 ${i ? "ml-2" : ""}`}
              initial={{ backgroundColor: "rgba(139,108,255,0)", color: "#9b98a8" }}
              animate={{ backgroundColor: i === 3 ? "rgba(139,108,255,0.2)" : "rgba(139,108,255,0)", color: i === 3 ? "#efedf5" : "#9b98a8" }}
              transition={{ delay: i === 3 ? 2.4 : 0, duration: 0.3 }}
            >
              {l}
            </motion.li>
          ))}
        </ul>
      </motion.aside>

      <div className="relative flex-1 overflow-hidden p-5 sm:p-6">
        <div className="absolute inset-0 [background-image:radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)] [background-size:16px_16px]" />
        <motion.p {...pop(0.3)} className="relative text-[10.5px] text-dim">
          Desktop — 1440
        </motion.p>
        <motion.div {...pop(0.4)} className="relative mt-2 h-[78%] overflow-hidden rounded-xl border border-line-2 bg-[#0b0b10]">
          {/* nawigacja */}
          <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
            <motion.span className="h-2 w-10 origin-left rounded-full bg-white/60" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8, duration: 0.6, ease }} />
            <span className="flex gap-2">
              {[0, 1, 2].map((k) => (
                <motion.span key={k} className="h-1.5 w-6 rounded-full bg-white/25" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 + k * 0.1 }} />
              ))}
            </span>
          </div>
          <div className="grid grid-cols-[1.2fr_1fr] gap-3 p-3 sm:p-4">
            <div className="pt-2">
              {[0.95, 0.75, 0.5].map((w, k) => (
                <motion.span
                  key={k}
                  className="mb-2 block h-3.5 origin-left rounded-md sm:h-4"
                  style={{ width: `${w * 100}%` }}
                  initial={{ scaleX: 0, backgroundColor: "rgba(255,255,255,0.18)" }}
                  animate={{ scaleX: 1, backgroundColor: k === 2 ? "#b4a2ff" : "rgba(239,237,245,0.85)" }}
                  transition={{ scaleX: { delay: 1.1 + k * 0.15, duration: 0.7, ease }, backgroundColor: { delay: fill + k * 0.08, duration: 0.6 } }}
                />
              ))}
              <motion.span className="mt-3 block h-1.5 w-4/5 rounded-full bg-white/15" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} />
              <motion.span className="mt-1.5 block h-1.5 w-3/5 rounded-full bg-white/15" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 }} />
              {/* przycisk z zaznaczeniem */}
              <motion.div className="relative mt-4 w-fit" initial={{ x: 0 }} animate={{ x: [0, 0, 10] }} transition={{ delay: 2.6, duration: 0.9, times: [0, 0.3, 1], ease }}>
                <motion.span
                  className="block h-7 w-[92px] rounded-full"
                  initial={{ backgroundColor: "rgba(255,255,255,0)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.3)" }}
                  animate={{ backgroundColor: "#8b6cff", boxShadow: "inset 0 0 0 1px rgba(139,108,255,1)" }}
                  transition={{ delay: fill + 0.2, duration: 0.6 }}
                />
                <motion.span className="pointer-events-none absolute -inset-1.5 border border-accent" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ delay: 2.3, duration: 2.2, times: [0, 0.1, 0.85, 1] }}>
                  {["-top-[3px] -left-[3px]", "-top-[3px] -right-[3px]", "-bottom-[3px] -left-[3px]", "-bottom-[3px] -right-[3px]"].map((c) => (
                    <span key={c} className={`absolute size-1.5 border border-accent bg-white ${c}`} />
                  ))}
                  <span className="absolute top-full left-1/2 mt-1.5 -translate-x-1/2 rounded bg-accent px-1 text-[9px] whitespace-nowrap text-white">184 × 52</span>
                </motion.span>
              </motion.div>
            </div>
            <motion.div
              className="relative overflow-hidden rounded-lg"
              initial={{ opacity: 0, backgroundColor: "rgba(255,255,255,0.05)" }}
              animate={{ opacity: 1, backgroundColor: "rgba(139,108,255,0.25)" }}
              transition={{ opacity: { delay: 1.4, duration: 0.6 }, backgroundColor: { delay: fill + 0.3, duration: 0.8 } }}
            >
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
                <motion.path d="M0 0L100 100M100 0L0 100" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: fill + 0.3 }} />
              </svg>
              <motion.span
                className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#c9b8ff,transparent_55%),radial-gradient(circle_at_80%_80%,#8b6cff,transparent_60%)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.9 }}
                transition={{ delay: fill + 0.4, duration: 1 }}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* telefon */}
        <motion.div
          className="absolute right-4 bottom-4 hidden h-[46%] w-[22%] overflow-hidden rounded-[14px] border border-line-2 bg-[#0b0b10] p-1.5 shadow-[0_20px_40px_-10px_rgb(0_0_0/0.6)] sm:block"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4.4, duration: 0.8, ease }}
        >
          <span className="block h-[45%] rounded-[9px] bg-[radial-gradient(circle_at_30%_30%,#c9b8ff,transparent_55%),radial-gradient(circle_at_80%_80%,#8b6cff,transparent_60%)] opacity-80" />
          <span className="mt-2 block h-1.5 w-4/5 rounded-full bg-white/70" />
          <span className="mt-1 block h-1.5 w-3/5 rounded-full bg-accent-2" />
          <span className="mt-2.5 block h-3.5 w-1/2 rounded-full bg-accent" />
        </motion.div>

        {/* komentarz klienta */}
        <motion.div
          className="absolute top-[18%] right-[8%] z-10 flex items-center gap-2 rounded-full rounded-bl-sm border border-line-2 bg-surface-2 py-1.5 pr-3 pl-1.5 text-[11.5px] shadow-[0_10px_30px_-10px_rgb(0_0_0/0.6)]"
          initial={{ opacity: 0, scale: 0.6, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 5.1, duration: 0.6, ease }}
        >
          <span className="grid size-5 place-items-center rounded-full bg-[#d98b5f] text-[10px] font-medium text-white">K</span>
          Akceptuję, świetne!
        </motion.div>

        <Cursor path={{ x: ["80%", "40%", "33%", "36%"], y: ["85%", "70%", "62%", "62%"] }} delay={1.2} duration={2.2} label="Ty" />
      </div>
    </div>
  );
}

/* ---------- 4. Wdrożenie ---------- */

const log = [
  { t: "$ npm run build", c: "text-ink" },
  { t: "✓ Kompilacja — 4,2 s", c: "text-emerald-300" },
  { t: "✓ Obrazy zoptymalizowane (−82%)", c: "text-emerald-300" },
  { t: "✓ SEO: meta, sitemap, schema", c: "text-emerald-300" },
  { t: "$ deploy --prod", c: "text-ink" },
];
const scores = [
  { label: "Wydajność", v: 100 },
  { label: "SEO", v: 100 },
  { label: "Dostępność", v: 98 },
];

export function LaunchScene() {
  const done = 3.6;
  return (
    <div className="grid h-full gap-3 p-5 sm:grid-cols-[1.2fr_1fr] sm:p-7">
      <motion.div {...pop(0.2)} className="flex flex-col rounded-2xl border border-line bg-[#060608] p-4 font-mono text-[11.5px] leading-relaxed">
        <p className="mb-2 text-[10.5px] text-dim">terminal</p>
        {log.map((l, i) => (
          <motion.p key={l.t} className={l.c} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.5, duration: 0.4 }}>
            {l.t}
          </motion.p>
        ))}
        <motion.div className="mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }}>
          <span className="block h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.span className="block h-full origin-left rounded-full bg-accent" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 3, duration: 0.8, ease: "easeInOut" }} />
          </span>
        </motion.div>
        {["✓ Domena i certyfikat SSL", "✓ Analityka i formularz podpięte"].map((t, i) => (
          <motion.p key={t} className="mt-1 text-emerald-300 first:mt-2" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: done + i * 0.35, duration: 0.4 }}>
            {t}
          </motion.p>
        ))}
        <motion.p className="mt-auto pt-3 text-accent-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: done + 0.9 }}>
          <motion.span className="inline-block" animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.6, delay: done + 0.9 }}>
            ●
          </motion.span>{" "}
          Live → twojafirma.pl
        </motion.p>
      </motion.div>

      <div className="flex flex-col gap-3">
        <motion.div {...pop(0.5)} className="rounded-2xl border border-line bg-bg/60 p-4">
          <p className="text-[10.5px] text-dim">Lighthouse</p>
          <div className="mt-3 flex justify-between gap-2">
            {scores.map((s, i) => {
              const d = done + 0.3 + i * 0.15;
              return (
                <div key={s.label} className="flex flex-col items-center gap-1.5">
                  <span className="relative grid size-14 place-items-center">
                    <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90" aria-hidden>
                      <circle cx="20" cy="20" r="17" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" fill="none" />
                      <motion.circle cx="20" cy="20" r="17" stroke="#6ee7b7" strokeWidth="2.5" fill="none" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: s.v / 100 }} transition={{ delay: d, duration: 1.4, ease }} />
                    </svg>
                    <span className="text-[15px] font-medium text-emerald-200">
                      <Count to={s.v} delay={d} />
                    </span>
                  </span>
                  <span className="text-[10px] text-muted">{s.label}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div {...pop(done + 0.6)} className="hidden flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-bg/60 sm:flex">
          <div className="flex items-center gap-2 border-b border-line px-3 py-2">
            <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="truncate text-[11px] text-muted">twojafirma.pl</span>
          </div>
          <div className="relative flex-1 bg-[radial-gradient(circle_at_70%_20%,rgb(139_108_255/0.35),transparent_60%)] p-3">
            <span className="block h-2.5 w-3/4 rounded bg-white/80" />
            <span className="mt-1.5 block h-2.5 w-1/2 rounded bg-accent-2" />
            <span className="mt-3 block h-4 w-16 rounded-full bg-accent" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
