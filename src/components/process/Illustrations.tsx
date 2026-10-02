"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { MARK, STROKE } from "@/lib/logo";

/*
 * Sceny etapów procesu — bez ramek, lekkie (DOM/SVG, transform i opacity),
 * grają wyłącznie, gdy są na ekranie.
 */

const ease = [0.16, 1, 0.3, 1] as const;

// licznik pętli: rośnie co `ms`, tylko gdy element jest widoczny
function useLoop(ms: number) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const [k, setK] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setK((x) => x + 1), ms);
    return () => clearInterval(t);
  }, [inView, ms]);
  return { ref, k, inView };
}

// harmonogram kroków sceny: [czas w s, krok]; restart przy każdej pętli
function useTimeline(steps: [number, number][], k: number, active: boolean) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) return;
    const ts = steps.map(([t, s]) => setTimeout(() => setStep(s), t * 1000));
    return () => ts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, active]);
  return step;
}

// Pozycje elementów (środki) względem kontenera — do prowadzenia kursora
function useTargets<K extends string>() {
  const box = useRef<HTMLDivElement>(null);
  const els = useRef<Partial<Record<K, HTMLElement | null>>>({});
  const [pos, setPos] = useState<Partial<Record<K, { x: number; y: number }>>>({});
  const measure = useCallback(() => {
    const b = box.current?.getBoundingClientRect();
    if (!b) return;
    const out: Partial<Record<K, { x: number; y: number }>> = {};
    for (const [key, el] of Object.entries(els.current) as [K, HTMLElement | null][]) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      out[key] = { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 };
    }
    setPos(out);
  }, []);
  useEffect(() => {
    const t = setTimeout(measure, 50);
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [measure]);
  const reg = (key: K) => (el: HTMLElement | null) => {
    els.current[key] = el;
  };
  return { box, pos, reg };
}

// Kursor z „kliknięciem” (fala) — jedzie do punktu sprężyną
function Cursor({ at, clicks, label = "Ty" }: { at?: { x: number; y: number }; clicks: number; label?: string }) {
  return (
    <motion.div className="pointer-events-none absolute top-0 left-0 z-30" initial={false} animate={at ? { x: at.x - 4, y: at.y - 2, opacity: 1 } : { opacity: 0 }} transition={{ type: "spring", stiffness: 90, damping: 18, mass: 0.9 }}>
      <AnimatePresence>
        {clicks > 0 && (
          <motion.span key={clicks} className="absolute -top-4 -left-4 size-9 rounded-full border-2 border-accent-2" initial={{ scale: 0.3, opacity: 1 }} animate={{ scale: 1.6, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} />
        )}
      </AnimatePresence>
      <motion.svg key={`c${clicks}`} width="22" height="22" viewBox="0 0 18 18" animate={{ scale: [1, 0.78, 1] }} transition={{ duration: 0.25 }} className="drop-shadow-[0_4px_10px_rgb(0_0_0/0.6)]">
        <path d="M2 1.5l13 6.2-5.6 1.6L7 15z" fill="#efedf5" stroke="#07070a" strokeWidth="1.2" strokeLinejoin="round" />
      </motion.svg>
      <span className="ml-4 inline-block rounded-md bg-accent px-1.5 py-0.5 text-[10.5px] font-medium text-white">{label}</span>
    </motion.div>
  );
}

/* ---------- 1. Rozmowa: same dymki — klient pisze do mnie ---------- */

const chat = [
  { me: false, t: "Dzień dobry! Potrzebuję strony internetowej 👋" },
  { me: true, t: "Dzień dobry! Chętnie pomogę. Czym zajmuje się Twoja firma?" },
  { me: false, t: "Mam salon fryzjerski. Chcę, żeby klienci mogli umawiać się online." },
  { me: true, t: "Świetnie — zrobię stronę z rezerwacjami, idealną na telefon. Wycenę wyślę jutro ✨" },
];
const STEP = 1.9;

function Avatar({ me }: { me: boolean }) {
  return me ? (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-[#5b3fd6] text-[11px] font-medium text-white shadow-[0_0_20px_rgb(139_108_255/0.5)]">af.</span>
  ) : (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] text-ink ring-1 ring-white/15">Ty</span>
  );
}

export function TalkArt() {
  const { ref, k, inView } = useLoop(chat.length * STEP * 1000 + 3400);
  const [n, setN] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const ts: ReturnType<typeof setTimeout>[] = [setTimeout(() => setN(0), 0)];
    chat.forEach((_, i) => {
      ts.push(setTimeout(() => setTyping(true), (i * STEP + 0.3) * 1000));
      ts.push(
        setTimeout(() => {
          setTyping(false);
          setN(i + 1);
        }, (i * STEP + 1.3) * 1000),
      );
    });
    return () => ts.forEach(clearTimeout);
  }, [k, inView]);

  const next = chat[n];
  return (
    <div ref={ref} className="absolute inset-0 flex flex-col justify-center gap-3 [mask-image:linear-gradient(to_bottom,transparent,#000_14%)]">
      <AnimatePresence initial={false}>
        {chat.slice(0, n).map((m, i) => (
          <motion.div
            key={`${k}-${i}`}
            layout="position"
            className={`flex items-end gap-2.5 ${m.me ? "flex-row-reverse" : ""}`}
            initial={{ opacity: 0, y: 24, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ originX: m.me ? 1 : 0, originY: 1 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
          >
            <Avatar me={m.me} />
            <span
              className={`max-w-[78%] rounded-[22px] px-4 py-3 text-[14.5px] leading-snug shadow-[0_18px_40px_-18px_rgb(0_0_0/0.8)] sm:text-[15.5px] ${
                m.me ? "rounded-br-md bg-gradient-to-br from-accent to-[#6d4fe6] text-white" : "rounded-bl-md border border-white/10 bg-white/[0.06] text-ink"
              }`}
            >
              {m.t}
            </span>
          </motion.div>
        ))}
        {typing && next && (
          <motion.div key={`t-${k}-${n}`} layout="position" className={`flex items-end gap-2.5 ${next.me ? "flex-row-reverse" : ""}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
            <Avatar me={next.me} />
            <span className={`flex gap-1 rounded-[18px] px-4 py-3.5 ${next.me ? "rounded-br-md bg-accent/35" : "rounded-bl-md bg-white/[0.07]"}`}>
              {[0, 1, 2].map((d) => (
                <motion.span key={d} className="size-1.5 rounded-full bg-white/80" animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.9, delay: d * 0.15 }} />
              ))}
            </span>
          </motion.div>
        )}
        {n === chat.length && (
          <motion.p key={`d-${k}`} layout="position" className="mx-auto mt-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[12px] text-emerald-200" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 20 }}>
            ✓ Brief gotowy
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- 2. Kierunek: kursor wybiera kolory i font ---------- */

const swatches = ["#c8763a", "#2f5d46", "#8b6cff", "#e6566e", "#3b82f6"];
const fonts = [
  { id: "serif", label: "Serif", css: "Georgia, 'Times New Roman', serif", style: "italic", weight: 400 },
  { id: "round", label: "Rounded", css: "ui-rounded, 'SF Pro Rounded', 'Nunito', system-ui, sans-serif", style: "normal", weight: 700 },
  { id: "sato", label: "Satoshi", css: "var(--font-satoshi), sans-serif", style: "normal", weight: 500 },
];
type DirKey = "c0" | "c1" | "c2" | "c3" | "c4" | "f0" | "f1" | "f2" | "ok";
// kolejne kliknięcia kursora: [czas, cel]
const dirScript: [number, DirKey][] = [
  [0.6, "c0"],
  [1.7, "c1"],
  [2.8, "c2"],
  [3.9, "f0"],
  [5.0, "f2"],
  [6.2, "ok"],
];

export function DirectionArt() {
  const { ref, k, inView } = useLoop(9000);
  const { box, pos, reg } = useTargets<DirKey>();
  const step = useTimeline(dirScript.map(([t], i) => [t, i + 1]), k, inView);
  // stan wynikający z kliknięć do tej pory
  let color = "#efedf5";
  let font = fonts[2];
  let ok = false;
  for (const [, key] of dirScript.slice(0, step)) {
    if (key.startsWith("c")) color = swatches[Number(key[1])];
    if (key.startsWith("f")) font = fonts[Number(key[1])];
    if (key === "ok") ok = true;
  }
  // kursor jedzie do celu tuż przed kliknięciem
  const [aim, setAim] = useState<DirKey>("c0");
  useEffect(() => {
    if (!inView) return;
    const ts = dirScript.map(([t, key]) => setTimeout(() => setAim(key), (t - 0.75) * 1000));
    ts.push(setTimeout(() => setAim("c0"), 7600));
    return () => ts.forEach(clearTimeout);
  }, [k, inView]);

  return (
    <div ref={ref} className="absolute inset-0">
      <div ref={box} className="absolute inset-0 flex flex-col items-center justify-center gap-7">
        {/* podgląd marki */}
        <div className="text-center">
          <motion.p
            key={font.id}
            className="text-[clamp(2.8rem,6vw,4.4rem)] leading-none tracking-[-0.03em]"
            style={{ fontFamily: font.css, fontStyle: font.style, fontWeight: font.weight }}
            initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)", color }}
            transition={{ duration: 0.5, ease, color: { duration: 0.5 } }}
          >
            Twoja marka
          </motion.p>
          <motion.span className="mx-auto mt-4 block h-1 w-24 rounded-full" animate={{ backgroundColor: color, width: ok ? 160 : 96 }} transition={{ duration: 0.5, ease }} />
        </div>

        {/* kolory */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {swatches.map((c, i) => {
            const on = color === c;
            return (
              <motion.span
                key={c}
                ref={reg(`c${i}` as DirKey)}
                className="relative size-8 rounded-full sm:size-11"
                style={{ background: c }}
                animate={{ scale: on ? 1.15 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
              >
                {on && <motion.span layoutId="dir-ring" className="absolute -inset-1.5 rounded-full border-2 border-white" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
              </motion.span>
            );
          })}
        </div>

        {/* fonty */}
        <div className="flex flex-wrap justify-center gap-2">
          {fonts.map((f, i) => {
            const on = font.id === f.id;
            return (
              <span
                key={f.id}
                ref={reg(`f${i}` as DirKey)}
                className={`relative flex items-baseline gap-1.5 rounded-full px-4 py-2 text-[13px] transition-colors duration-300 ${on ? "text-bg" : "text-muted"}`}
              >
                {on ? <motion.span layoutId="dir-font" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 400, damping: 32 }} /> : <span className="absolute inset-0 rounded-full border border-white/15" />}
                <span className="relative text-[17px]" style={{ fontFamily: f.css, fontStyle: f.style, fontWeight: f.weight }}>
                  Aa
                </span>
                <span className="relative max-sm:hidden">{f.label}</span>
              </span>
            );
          })}
        </div>

        {/* zatwierdzenie */}
        <motion.span
          ref={reg("ok")}
          className="flex h-11 items-center gap-2 rounded-full px-5 text-[14px] font-medium"
          animate={ok ? { backgroundColor: "#8b6cff", color: "#ffffff", scale: [1, 0.94, 1.04, 1] } : { backgroundColor: "rgba(255,255,255,0.06)", color: "#9b98a8", scale: 1 }}
          transition={{ duration: 0.45 }}
        >
          {ok ? "✓ Styl zatwierdzony" : "Zatwierdź styl"}
        </motion.span>
      </div>
      {inView && <Cursor at={pos[aim]} clicks={step} />}
    </div>
  );
}

/* ---------- 3. Projekt: konstrukcja znaku (bez tła) ---------- */

export function DesignArt() {
  const { ref, k, inView } = useLoop(8000);
  const c = MARK.circles[0];
  const draw = (d: number, dur = 1) => ({ initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { pathLength: { delay: d, duration: dur, ease }, opacity: { delay: d, duration: 0.2 } } });
  const fade = (d: number) => ({ initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: d, duration: 0.5 } });
  const nodes = [
    [25, 42.5],
    [25, 17],
    [32, 10],
    [39.5, 10],
    [25, 24],
    [34.5, 24],
    [16, 22],
    [7, 31],
  ];
  return (
    <div ref={ref} className="absolute inset-0">
      {inView && (
        <svg key={k} viewBox="-8 0 60 52" className="absolute inset-0 size-full overflow-visible [mask-image:radial-gradient(closest-side,#000_70%,transparent)]" fill="none" aria-hidden>
          {[
            ["M-8 42.5H52", 0.2],
            ["M-8 22H52", 0.3],
            ["M-8 10H52", 0.4],
            ["M25 0V52", 0.35],
            ["M16 0V52", 0.45],
            ["M7 0V52", 0.55],
          ].map(([d, dl]) => (
            <motion.path key={d as string} d={d as string} stroke="#8b6cff" strokeOpacity="0.4" strokeWidth="0.15" strokeDasharray="0.7 0.7" {...draw(dl as number, 1.2)} />
          ))}
          <motion.circle cx={c.cx} cy={c.cy} r={c.r + STROKE / 2} stroke="rgba(255,255,255,0.3)" strokeWidth="0.15" strokeDasharray="0.6 0.6" {...draw(0.8, 1.2)} />
          <motion.circle cx={c.cx} cy={c.cy} r={c.r - STROKE / 2} stroke="rgba(255,255,255,0.3)" strokeWidth="0.15" strokeDasharray="0.6 0.6" {...draw(0.95, 1.2)} />
          <motion.circle cx="32" cy="17" r="7" stroke="rgba(180,162,255,0.45)" strokeWidth="0.15" strokeDasharray="0.6 0.6" {...draw(1.1, 1)} />
          <motion.g {...fade(1.7)}>
            <path d="M7 47.5H25" stroke="#b4a2ff" strokeWidth="0.15" />
            <path d="M7 46.8v1.4M25 46.8v1.4" stroke="#b4a2ff" strokeWidth="0.15" />
            <rect x="12.2" y="46.4" width="7.6" height="2.2" rx="0.5" fill="#8b6cff" />
            <text x="16" y="48" textAnchor="middle" fontSize="1.3" fill="#fff" fontFamily="var(--font-satoshi)">
              18 px
            </text>
          </motion.g>
          <motion.circle cx={c.cx} cy={c.cy} r={c.r} stroke="#efedf5" strokeWidth={STROKE} {...draw(2, 1.1)} />
          {MARK.paths.map((d, i) => (
            <motion.path key={d} d={d} stroke="#efedf5" strokeWidth={STROKE} {...draw(2.4 + i * 0.35, 1)} />
          ))}
          <motion.rect
            x={MARK.dot.x}
            y={MARK.dot.y}
            width={MARK.dot.size}
            height={MARK.dot.size}
            fill="#8b6cff"
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1], opacity: 1 }}
            transition={{ delay: 3.7, duration: 0.7 }}
          />
          <motion.circle
            cx={MARK.dot.x + 2.5}
            cy={MARK.dot.y + 2.5}
            r="3"
            stroke="#8b6cff"
            strokeWidth="0.3"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 2.6], opacity: [0.8, 0] }}
            transition={{ delay: 3.9, duration: 1.1 }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
          {nodes.map(([x, y], i) => (
            <motion.rect key={i} x={x - 0.7} y={y - 0.7} width="1.4" height="1.4" fill="#07070a" stroke="#8b6cff" strokeWidth="0.25" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ delay: 2.2 + i * 0.12, duration: 3.2, times: [0, 0.1, 0.8, 1] }} />
          ))}
          {/* kursor projektanta */}
          <motion.g initial={{ x: 46, y: 46, opacity: 0 }} animate={{ x: [46, 36, 36, 30], y: [46, 39, 39, 12], opacity: [0, 1, 1, 0] }} transition={{ delay: 3.2, duration: 3, times: [0, 0.3, 0.6, 1], ease: "easeInOut" }}>
            <path d="M0 0l3.2 1.5-1.4.4L1.2 3.3z" fill="#efedf5" stroke="#07070a" strokeWidth="0.2" strokeLinejoin="round" />
            <rect x="3" y="2.6" width="4.4" height="1.6" rx="0.4" fill="#8b6cff" />
            <text x="5.2" y="3.75" textAnchor="middle" fontSize="1" fill="#fff" fontFamily="var(--font-satoshi)">
              afto
            </text>
          </motion.g>
        </svg>
      )}
    </div>
  );
}

/* ---------- 4. Wdrożenie: kursor klika „Opublikuj” ---------- */

type LaunchKey = "btn" | "rest";
const launchScript: [number, number][] = [
  [0.0, 0], // szkic
  [1.3, 1], // kursor nad przyciskiem
  [1.9, 2], // klik → publikowanie
  [3.6, 3], // opublikowano
  [4.6, 4], // pierwsze zapytanie od klienta
];

export function LaunchArt() {
  const { ref, k, inView } = useLoop(8500);
  const { box, pos, reg } = useTargets<LaunchKey>();
  const phase = useTimeline(launchScript, k, inView);
  const live = phase >= 3;

  return (
    <div ref={ref} className="absolute inset-0">
      <div ref={box} className="absolute inset-0 flex flex-col items-center justify-center gap-8">
        {/* adres strony */}
        <motion.div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] py-2 pr-5 pl-3 text-[14px]" animate={{ borderColor: live ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.1)" }}>
          <span className="relative flex size-2.5">
            {live && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400" />}
            <motion.span className="relative size-2.5 rounded-full" animate={{ backgroundColor: live ? "#34d399" : "#615e6e" }} />
          </span>
          <span className="text-muted">https://</span>
          <span className="-ml-2.5 text-ink">twojafirma.pl</span>
          <AnimatePresence mode="wait">
            <motion.span key={String(live)} className={`ml-1 text-[12px] ${live ? "text-emerald-300" : "text-dim"}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
              {live ? "online" : "wersja robocza"}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        {/* przycisk publikacji */}
        <div className="relative">
          <motion.span
            ref={reg("btn")}
            className="relative flex h-16 items-center justify-center overflow-hidden rounded-full text-[16px] font-medium"
            animate={{
              width: phase === 2 ? 240 : live ? 220 : 230,
              backgroundColor: live ? "#10b981" : phase >= 1 ? "#8b6cff" : "#efedf5",
              color: phase >= 1 ? "#ffffff" : "#07070a",
              scale: phase === 2 ? [1, 0.93, 1] : 1,
              boxShadow: phase >= 1 ? "0 0 50px rgba(139,108,255,0.55)" : "0 0 0 rgba(0,0,0,0)",
            }}
            transition={{ duration: 0.4 }}
          >
            {phase === 2 && <motion.span className="absolute inset-y-0 left-0 bg-white/25" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.6, ease: "easeInOut" }} />}
            <AnimatePresence mode="wait">
              <motion.span key={phase === 2 ? "p" : live ? "l" : "d"} className="relative flex items-center gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                {phase === 2 ? "Publikowanie…" : live ? "✓ Opublikowano" : "Opublikuj stronę ↗"}
              </motion.span>
            </AnimatePresence>
          </motion.span>
          {/* iskry przy starcie */}
          {live &&
            Array.from({ length: 14 }).map((_, i) => {
              const a = (i / 14) * Math.PI * 2;
              return (
                <motion.span
                  key={`${k}-${i}`}
                  className="absolute top-1/2 left-1/2 size-1.5 rounded-full"
                  style={{ background: ["#34d399", "#b4a2ff", "#efe9ff"][i % 3] }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                  animate={{ x: Math.cos(a) * (130 + (i % 3) * 25), y: Math.sin(a) * (60 + (i % 4) * 12), opacity: 0, scale: 1.3 }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                />
              );
            })}
        </div>

        {/* pierwsze zapytanie od klienta */}
        <div className="h-[72px]">
          <AnimatePresence>
            {phase >= 4 && (
              <motion.div
                key={`n-${k}`}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] py-3 pr-5 pl-3 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)]"
                initial={{ opacity: 0, y: 24, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-accent/20 text-[18px]">📩</span>
                <span>
                  <span className="block text-[13.5px] text-ink">Nowe zapytanie ze strony</span>
                  <span className="block text-[12.5px] text-muted">„Dzień dobry, chciałbym umówić wizytę…”</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <span ref={reg("rest")} className="absolute right-[18%] bottom-[16%] size-1" />
      </div>
      {inView && <Cursor at={phase >= 1 && phase < 3 ? pos.btn : pos.rest} clicks={phase >= 2 ? 1 : 0} />}
    </div>
  );
}
