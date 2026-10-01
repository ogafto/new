"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useScroll, useTransform } from "motion/react";
import { CursorIcon } from "./figma/Cursor";
import { Handles } from "./figma/SelectionBox";
import { LogoMark } from "./Logo";

/*
 * Okno edytora w stylu Figmy, w którym strona "projektuje się" na żywo.
 * Wszystkie pozycje są w % ramki, więc kursory i zaznaczenia pasują na każdym ekranie.
 */

type Rect = { x: number; y: number; w: number; h: number };
type Pt = { x: number; y: number };

const rects: Record<string, Rect> = {
  heading: { x: 5, y: 20, w: 47, h: 22 },
  button: { x: 5, y: 56, w: 20, h: 9 },
  image: { x: 57, y: 16, w: 38, h: 50 },
  cards: { x: 5, y: 73, w: 90, h: 21 },
};

const BLUE = "#0d99ff";
const GREEN = "#0acf83";

const scenes: {
  sel?: keyof typeof rects;
  color: string;
  label: string;
  size: string;
  layer: number;
  tool: number;
  a: Pt;
  b: Pt;
  panel: { title: string; swatch: string; rows: [string, string][] };
}[] = [
  {
    sel: "heading",
    color: BLUE,
    label: "Nagłówek",
    size: "680 × 196",
    layer: 2,
    tool: 4,
    a: { x: 44, y: 36 },
    b: { x: 80, y: 88 },
    panel: { title: "Nagłówek", swatch: "#141414", rows: [["Font", "Geist"], ["Grubość", "Medium"], ["Rozmiar", "64"], ["Interlinia", "100%"]] },
  },
  {
    sel: "button",
    color: BLUE,
    label: "Przycisk CTA",
    size: "280 × 64",
    layer: 3,
    tool: 0,
    a: { x: 21, y: 63 },
    b: { x: 76, y: 84 },
    panel: { title: "Przycisk CTA", swatch: BLUE, rows: [["Wypełnienie", "#0D99FF"], ["Promień", "999"], ["Padding", "16 · 28"], ["Efekt", "Cień"]] },
  },
  {
    sel: "image",
    color: GREEN,
    label: "Zdjęcie",
    size: "548 × 440",
    layer: 4,
    tool: 0,
    a: { x: 30, y: 46 },
    b: { x: 86, y: 52 },
    panel: { title: "Zdjęcie", swatch: "linear-gradient(135deg,#ffb36b,#ff6b8b,#8b5cf6)", rows: [["Wypełnienie", "Gradient"], ["Promień", "24"], ["Proporcje", "5:4"], ["Efekt", "Blur tła"]] },
  },
  {
    sel: "cards",
    color: BLUE,
    label: "Karty · Auto layout",
    size: "1296 × 184",
    layer: 5,
    tool: 1,
    a: { x: 64, y: 88 },
    b: { x: 90, y: 38 },
    panel: { title: "Karty", swatch: "#ffffff", rows: [["Kierunek", "→ Poziomo"], ["Odstęp", "24"], ["Padding", "32"], ["Wyrównanie", "Środek"]] },
  },
  {
    color: BLUE,
    label: "",
    size: "",
    layer: 0,
    tool: 0,
    a: { x: 101, y: -9 },
    b: { x: 62, y: 60 },
    panel: { title: "Publikacja", swatch: GREEN, rows: [["Status", "Online ✓"], ["SSL", "Aktywny"], ["Responsywność", "100%"], ["SEO", "Gotowe"]] },
  },
];

const layers = ["Desktop", "Nawigacja", "Nagłówek", "Przycisk CTA", "Zdjęcie", "Karty", "Stopka"];

const tools = [
  <path key="move" d="M4 3l9 4.5-3.8 1.2L7.8 12.5z" />,
  <rect key="frame" x="3" y="3" width="10" height="10" rx="1" fill="none" strokeWidth="1.3" />,
  <circle key="ellipse" cx="8" cy="8" r="5" fill="none" strokeWidth="1.3" />,
  <path key="pen" d="M3 13l2-5 5-5 3 3-5 5zM8 6l2 2" fill="none" strokeWidth="1.3" />,
  <path key="text" d="M4 4h8M8 4v9" fill="none" strokeWidth="1.5" />,
  <path key="comment" d="M3 4h10v7H7l-3 2v-2H3z" fill="none" strokeWidth="1.3" />,
];

const spring = { type: "spring", stiffness: 70, damping: 16, mass: 0.9 } as const;

function StudioCursor({ p, color, name }: { p: Pt; color: string; name: string }) {
  return (
    <motion.div
      className="pointer-events-none absolute z-30"
      animate={{ left: `${p.x}%`, top: `${p.y}%` }}
      transition={spring}
      initial={false}
    >
      <CursorIcon color={color} />
      <span className="mt-0.5 ml-3 block rounded-full rounded-tl-sm px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-white shadow-lg sm:text-[11px]" style={{ background: color }}>
        {name}
      </span>
    </motion.div>
  );
}

function Site({ step }: { step: number }) {
  const blue = step >= 1;
  const image = step >= 2;
  const cards = step >= 3;
  return (
    <div className="@container absolute inset-0 overflow-hidden rounded-[0.5cqw] bg-[#f6f5f1] text-[#141414] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.7)]">
      {/* nawigacja */}
      <div className="absolute top-[4%] right-[5%] left-[5%] flex h-[6%] items-center justify-between">
        <span className="text-[1.7cqw] font-semibold tracking-tight">
          Lumen<span className="text-[#0d99ff]">.</span>
        </span>
        <span className="hidden gap-[2.4cqw] text-[1.1cqw] text-[#6b6b6b] @[300px]:flex">
          <span>Oferta</span>
          <span>O nas</span>
          <span>Opinie</span>
        </span>
        <span className="rounded-full bg-[#141414] px-[1.6cqw] py-[0.6cqw] text-[1cqw] text-white">Kontakt</span>
      </div>

      {/* nagłówek */}
      <div className="absolute top-[20%] left-[5%] w-[47%]">
        <p className="text-[4.5cqw] leading-[1.02] font-medium tracking-[-0.05em]">Więcej klientów. Mniej wysiłku.</p>
      </div>
      <p className="absolute top-[45%] left-[5%] w-[40%] text-[1.25cqw] leading-snug text-[#6b6b6b]">
        Nowoczesna strona, która pracuje na Twój biznes 24/7 — także kiedy śpisz.
      </p>

      {/* przycisk */}
      <motion.div
        className="absolute top-[56%] left-[5%] flex h-[9%] w-[20%] items-center justify-center rounded-full text-[1.3cqw] font-medium"
        animate={{
          backgroundColor: blue ? BLUE : "#dcdcd8",
          color: blue ? "#ffffff" : "#6b6b6b",
          boxShadow: blue ? "0 1.2cqw 2.4cqw -1cqw rgba(13,153,255,.7)" : "0 0 0 rgba(0,0,0,0)",
        }}
        transition={{ duration: 0.6 }}
      >
        Umów rozmowę →
      </motion.div>

      {/* zdjęcie */}
      <div className="absolute top-[16%] left-[57%] h-[50%] w-[38%] overflow-hidden rounded-[1.4cqw] bg-[#e6e4de]">
        <svg className="absolute top-1/2 left-1/2 w-[18%] -translate-x-1/2 -translate-y-1/2 text-[#b9b6ad]" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="9" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 17l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <motion.div
          className="absolute inset-0"
          style={{ background: "radial-gradient(circle at 30% 25%, #ffd29b, transparent 45%), radial-gradient(circle at 75% 70%, #8b5cf6, transparent 50%), linear-gradient(135deg, #ff9a6b, #ff6b8b 50%, #6d5cf6)" }}
          animate={{ opacity: image ? 1 : 0, scale: image ? 1 : 1.15 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 aspect-square w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 backdrop-blur-md"
          animate={{ opacity: image ? 1 : 0, scale: image ? 1 : 0.6 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        />
      </div>

      {/* karty */}
      <div className="absolute top-[73%] left-[5%] flex h-[21%] w-[90%] gap-[2.6%]">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="relative flex-1 rounded-[1cqw] p-[1.4cqw]"
            animate={{
              backgroundColor: cards ? "#ffffff" : "rgba(255,255,255,0)",
              borderColor: cards ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.18)",
            }}
            style={{ borderWidth: 1, borderStyle: cards ? "solid" : "dashed" }}
            transition={{ delay: cards ? i * 0.12 : 0, duration: 0.5 }}
          >
            <motion.div animate={{ opacity: cards ? 1 : 0, y: cards ? 0 : 6 }} transition={{ delay: cards ? 0.15 + i * 0.12 : 0 }}>
              <span className="mb-[1cqw] block size-[2.6cqw] rounded-[0.6cqw]" style={{ background: ["#0d99ff", "#ff7262", "#0acf83"][i] }} />
              <span className="block text-[1.2cqw] font-medium">{["Szybko", "Pięknie", "Skutecznie"][i]}</span>
              <span className="mt-[0.6cqw] block h-[0.5cqw] w-3/4 rounded-full bg-black/10" />
            </motion.div>
          </motion.div>
        ))}
        {/* znaczniki odstępów auto layoutu */}
        <AnimatePresence>
          {step === 3 &&
            [0, 1].map((i) => (
              <motion.span
                key={i}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[0.4cqw] bg-[#f24e8e] px-[0.5cqw] font-mono text-[0.95cqw] text-white"
                style={{ left: `${(i + 1) * 33.33 - 0.6}%` }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.5 }}
              >
                24
              </motion.span>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Studio() {
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap, { margin: "-10% 0px" });
  const [step, setStep] = useState(0);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start end", "start 25%"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [26, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [40, 0]);

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => setStep((s) => (s + 1) % scenes.length), 2800);
    return () => clearInterval(id);
  }, [inView]);

  const scene = scenes[step];
  const sel = scene.sel ? rects[scene.sel] : null;

  return (
    <div ref={wrap} className="relative mx-auto -mt-6 max-w-[1240px] px-3 sm:px-6" style={{ perspective: 2000 }}>
      {/* poświata pod oknem */}
      <div className="pointer-events-none absolute inset-x-[10%] top-[10%] bottom-0 rounded-[50%] bg-gradient-to-r from-sel/30 via-comp/25 to-fig-coral/20 blur-[100px]" aria-hidden />

      <motion.div
        className="hairline relative overflow-hidden rounded-2xl bg-[#0b0b0d] shadow-[0_60px_120px_-40px_rgb(0_0_0/0.9)] sm:rounded-[20px]"
        style={{ rotateX, scale, y, transformOrigin: "50% 0%" }}
        aria-label="Podgląd: projektowanie strony w Figmie"
        role="img"
      >
        {/* pasek tytułowy */}
        <div className="flex h-11 items-center justify-between border-b border-line px-3 sm:px-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-2.5 rounded-full bg-white/12" />
              ))}
            </div>
            <LogoMark className="ml-1 hidden size-6 sm:grid" />
            <span className="truncate text-[12px] text-muted">
              Projekty <span className="text-dim">/</span> <span className="text-ink">Twoja strona</span>
            </span>
          </div>

          <div className="hidden items-center gap-0.5 rounded-lg bg-white/[0.04] p-0.5 md:flex">
            {tools.map((t, i) => (
              <span
                key={i}
                className={`grid size-7 place-items-center rounded-md transition-colors duration-300 ${scene.tool === i ? "bg-sel text-white" : "text-muted"}`}
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" stroke="currentColor" strokeLinejoin="round" strokeLinecap="round">
                  {t}
                </svg>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex -space-x-1.5">
              <span className="grid size-6 place-items-center rounded-full bg-sel text-[10px] font-semibold ring-2 ring-[#0b0b0d]">A</span>
              <span className="grid size-6 place-items-center rounded-full bg-fig-green text-[10px] font-semibold text-black ring-2 ring-[#0b0b0d]">K</span>
            </div>
            <span className="hidden rounded-md bg-sel px-2.5 py-1 text-[11px] font-medium text-white sm:block">Udostępnij</span>
            <span className="hidden font-mono text-[11px] text-muted lg:block">100%</span>
          </div>
        </div>

        <div className="flex h-[clamp(340px,56vw,640px)]">
          {/* warstwy */}
          <aside className="hidden w-52 shrink-0 border-r border-line p-2 text-[12px] md:block">
            <div className="flex gap-3 px-2 pt-1 pb-3 text-[11px]">
              <span className="text-ink">Warstwy</span>
              <span className="text-dim">Zasoby</span>
            </div>
            <ul className="space-y-px">
              {layers.map((l, i) => (
                <li
                  key={l}
                  className={`flex items-center gap-2 rounded-md py-1.5 pr-2 transition-colors duration-300 ${i === 0 ? "pl-2" : "pl-6"} ${
                    scene.layer === i ? "bg-sel/20 text-ink" : "text-muted"
                  }`}
                >
                  <span className={`font-mono text-[10px] ${scene.layer === i ? "text-sel" : "text-dim"}`}>{i === 0 ? "#" : i === 2 ? "T" : "▢"}</span>
                  {l}
                </li>
              ))}
            </ul>
          </aside>

          {/* płótno */}
          <div className="canvas-dots relative flex-1 overflow-hidden bg-[#0e0e10]">
            <span className="absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-md bg-sel px-2.5 py-1 text-[11px] font-medium text-white">
              <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
                <path d="M1 0.5l6 3.5-6 3.5z" fill="currentColor" />
              </svg>
              Publikuj
            </span>

            <div className="absolute top-[13%] left-[8%] h-[79%] w-[84%]">
              <span className="absolute -top-5 left-0 font-mono text-[10px] text-muted sm:text-[11px]">Desktop — Twoja strona</span>
              <Site step={step} />

              {/* zaznaczenie przesuwa się między elementami */}
              <AnimatePresence>
                {sel && (
                  <motion.div
                    className="pointer-events-none absolute z-20 border-[1.5px]"
                    initial={{ opacity: 0 }}
                    animate={{ left: `${sel.x}%`, top: `${sel.y}%`, width: `${sel.w}%`, height: `${sel.h}%`, borderColor: scene.color, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ ...spring, opacity: { duration: 0.2 } }}
                  >
                    <Handles color={scene.color} />
                    <span
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-[4px] px-1.5 py-px font-mono text-[10px] whitespace-nowrap text-white"
                      style={{ background: scene.color }}
                    >
                      {scene.size}
                    </span>
                    <span className="absolute -top-5 left-0 font-mono text-[10px] whitespace-nowrap" style={{ color: scene.color }}>
                      {scene.label}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* komentarz klienta */}
              <AnimatePresence>
                {step === 2 && (
                  <motion.div
                    className="absolute top-[4%] left-[70%] z-30 flex items-start gap-1.5"
                    initial={{ opacity: 0, scale: 0.6, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: 0.9, type: "spring", stiffness: 260, damping: 18 }}
                    style={{ transformOrigin: "0% 100%" }}
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full rounded-bl-none bg-fig-green text-[10px] font-semibold text-black">K</span>
                    <span className="rounded-xl rounded-tl-sm bg-white px-2.5 py-1.5 text-[10px] whitespace-nowrap text-black shadow-xl sm:text-[11px]">
                      Kiedy startujemy? 🚀
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {inView && (
                <>
                  <StudioCursor p={scene.a} color={BLUE} name="afto" />
                  <StudioCursor p={scene.b} color={GREEN} name="Klient" />
                </>
              )}
            </div>

            {/* komunikat po publikacji */}
            <AnimatePresence>
              {step === 4 && (
                <motion.div
                  className="glass hairline absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full py-1.5 pr-4 pl-1.5 text-[12px] whitespace-nowrap"
                  initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                >
                  <span className="grid size-5 place-items-center rounded-full bg-fig-green text-[11px] text-black">✓</span>
                  Strona jest online — gotowa na klientów
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* właściwości */}
          <aside className="hidden w-56 shrink-0 border-l border-line p-3 text-[12px] lg:block">
            <div className="flex gap-3 border-b border-line pb-3 text-[11px]">
              <span className="text-ink">Projekt</span>
              <span className="text-dim">Prototyp</span>
              <span className="text-dim">Kod</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 pt-4"
              >
                <p className="text-[11px] text-muted">{scene.panel.title}</p>
                <div className="flex items-center gap-2 rounded-md bg-white/[0.04] p-1.5">
                  <span className="size-5 rounded ring-1 ring-white/10" style={{ background: scene.panel.swatch }} />
                  <span className="font-mono text-[11px] text-ink">{scene.panel.rows[0][1]}</span>
                </div>
                <div className="space-y-1.5">
                  {scene.panel.rows.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between rounded-md bg-white/[0.04] px-2 py-1.5">
                      <span className="text-muted">{k}</span>
                      <span className="font-mono text-[11px] text-ink">{v}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="mt-5 border-t border-line pt-4">
              <p className="mb-2 text-[11px] text-muted">Podgląd</p>
              <div className="flex gap-1.5 font-mono text-[10px]">
                {["Desktop", "Tablet", "Mobile"].map((d) => (
                  <span key={d} className="rounded bg-fig-green/12 px-1.5 py-0.5 text-fig-green">
                    ✓ {d}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </motion.div>
    </div>
  );
}
