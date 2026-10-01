"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { MARK, STROKE } from "@/lib/logo";

/*
 * Sceny etapów procesu — lekkie (DOM/SVG, tylko transform i opacity),
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

/* ---------- 1. Rozmowa: czat z klientem ---------- */

const chat = [
  { me: false, t: "Dzień dobry! Potrzebuję strony internetowej dla mojej kawiarni ☕" },
  { me: true, t: "Dzień dobry! Chętnie pomogę. Co strona ma robić — menu, rezerwacje?" },
  { me: false, t: "Menu i rezerwacja stolika. I żeby świetnie wyglądała na telefonie." },
  { me: true, t: "Jasne. Jutro wyślę wycenę i propozycję terminu 👌" },
];
const STEP = 1.9;

function Typing({ me }: { me: boolean }) {
  return (
    <span className={`flex w-fit gap-1 rounded-2xl px-3.5 py-3 ${me ? "ml-auto rounded-br-md bg-accent/30" : "rounded-bl-md bg-white/[0.07]"}`}>
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="size-1.5 rounded-full bg-white/70" animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }} />
      ))}
    </span>
  );
}

export function TalkArt() {
  const { ref, k, inView } = useLoop(chat.length * STEP * 1000 + 3200);
  const [n, setN] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const ts: ReturnType<typeof setTimeout>[] = [];
    ts.push(setTimeout(() => setN(0), 0));
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
    <div ref={ref} className="absolute inset-0 flex flex-col p-5 sm:p-7">
      <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
        <span className="relative grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#d98b5f] to-[#8a4b2c] text-[13px] font-medium text-white">
          K
          <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-surface bg-emerald-400" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] text-ink">Kawiarnia Ziarno</span>
          <span className="block text-[12px] text-emerald-300/80">{typing && next && !next.me ? "pisze…" : "online"}</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-2.5 overflow-hidden pt-4">
        <AnimatePresence initial={false}>
          {chat.slice(0, n).map((m, i) => (
            <motion.div
              key={`${k}-${i}`}
              layout="position"
              className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-snug sm:text-[14px] ${m.me ? "ml-auto rounded-br-md bg-gradient-to-br from-accent to-[#6d4fe6] text-white" : "rounded-bl-md bg-white/[0.07] text-ink"}`}
              style={{ originX: m.me ? 1 : 0, originY: 1 }}
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            >
              {m.t}
            </motion.div>
          ))}
          {typing && next && (
            <motion.div key={`t-${k}-${n}`} layout="position" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
              <Typing me={next.me} />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {n === chat.length && (
            <motion.p
              key={`d-${k}`}
              className="mx-auto mt-2 flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[12px] text-emerald-200"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 20 }}
            >
              ✓ Brief gotowy — wycena w drodze
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------- 2. Kierunek: kolory i fonty ---------- */

const dirs = [
  { name: "Ciepło", font: "Georgia, 'Times New Roman', serif", style: "italic", weight: 400, fontName: "Serif · Italic", colors: ["#2b1d14", "#8a4b2c", "#c8763a", "#e4d5c3", "#f6efe6"], ink: "#f6efe6" },
  { name: "Natura", font: "ui-rounded, 'SF Pro Rounded', 'Nunito', system-ui, sans-serif", style: "normal", weight: 600, fontName: "Rounded · 600", colors: ["#14231b", "#2f5d46", "#7a9a84", "#cfe3c9", "#f2f4ea"], ink: "#cfe3c9" },
  { name: "Premium", font: "var(--font-satoshi), sans-serif", style: "normal", weight: 500, fontName: "Satoshi · 500", colors: ["#0e0b16", "#2a2140", "#8b6cff", "#c9b8ff", "#efe9ff"], ink: "#efe9ff" },
];

export function DirectionArt() {
  const { ref, k } = useLoop(2600);
  const d = dirs[k % dirs.length];
  const chosen = d.name === "Premium";
  return (
    <div ref={ref} className="absolute inset-0 grid place-items-center">
      <motion.div className="absolute inset-0" animate={{ backgroundColor: d.colors[0] }} transition={{ duration: 0.9 }} />
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_38%,rgb(255_255_255/0.08),transparent)]" />

      {/* próbniki na orbicie */}
      <div className="absolute inset-[10%] animate-[spin_40s_linear_infinite]">
        {d.colors.map((c, j) => {
          const a = (j / d.colors.length) * Math.PI * 2 - Math.PI / 2;
          return (
            <motion.span
              key={j}
              className="absolute size-[13%] -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white/15"
              style={{ left: `${50 + Math.cos(a) * 50}%`, top: `${50 + Math.sin(a) * 50}%` }}
              animate={{ backgroundColor: c }}
              transition={{ duration: 0.6, delay: j * 0.06 }}
            />
          );
        })}
      </div>

      <div className="relative flex flex-col items-center text-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={d.name}
            className="text-[clamp(3.4rem,8vw,6rem)] leading-none"
            style={{ fontFamily: d.font, fontStyle: d.style, fontWeight: d.weight, color: d.ink }}
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.9 }}
            transition={{ duration: 0.6, ease }}
          >
            Aa
          </motion.span>
        </AnimatePresence>
        <p className="mt-3 text-[12px] tracking-[0.04em]" style={{ color: d.ink, opacity: 0.7 }}>
          {d.fontName}
        </p>
        <div className="mt-4 flex gap-1">
          {d.colors.slice(1).map((c, j) => (
            <motion.span key={j} className="h-1.5 w-6 rounded-full" animate={{ backgroundColor: c }} transition={{ duration: 0.6, delay: j * 0.05 }} />
          ))}
        </div>
        <div className="mt-4 h-7">
          <AnimatePresence mode="wait">
            <motion.span
              key={d.name}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] ${chosen ? "bg-white text-[#0e0b16]" : "border border-white/20 text-white/70"}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
            >
              {chosen && "✓ "}
              {d.name}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
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

/* ---------- 4. Wdrożenie: strona trafia w świat ---------- */

function Count({ to, delay }: { to: number; delay: number }) {
  const v = useMotionValue(0);
  const r = useTransform(v, (x) => Math.round(x));
  useEffect(() => {
    const c = animate(v, to, { delay, duration: 1.6, ease });
    return () => c.stop();
  }, [v, to, delay]);
  return <motion.span>{r}</motion.span>;
}

// łuki z punktu startu (środek globu) do miast
const arcs = [
  { d: "M50 52 Q 26 10 14 30", end: [14, 30] },
  { d: "M50 52 Q 80 6 86 28", end: [86, 28] },
  { d: "M50 52 Q 92 50 90 66", end: [90, 66] },
  { d: "M50 52 Q 18 80 12 70", end: [12, 70] },
  { d: "M50 52 Q 60 92 66 86", end: [66, 86] },
];

export function LaunchArt() {
  const { ref, k, inView } = useLoop(6500);
  return (
    <div ref={ref} className="absolute inset-0">
      <div className="absolute top-1/2 right-[7%] aspect-square w-[min(44%,400px)] -translate-y-1/2 max-sm:top-[54%] max-sm:right-1/2 max-sm:w-[58%] max-sm:translate-x-1/2">
        <div className="absolute -inset-[20%] rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.32),transparent)]" />
        {/* glob: przesuwana mapa kropek w kole + cieniowanie kuli (tylko transform) */}
        <div className="absolute inset-0 overflow-hidden rounded-full bg-[#0d0b16]">
          <div className="absolute inset-y-0 left-0 w-[200%] animate-[globe_20s_linear_infinite] [background-image:radial-gradient(rgb(200_188_255/0.9)_1.1px,transparent_1.8px)] [background-size:10px_10px] will-change-transform" />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_28%,rgb(255_255_255/0.14),transparent_42%),radial-gradient(circle_at_50%_50%,transparent_42%,#07070a_80%)]" />
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
            {[18, 34, 50, 66, 82].map((y) => (
              <ellipse key={y} cx="50" cy={y} rx={Math.sqrt(Math.max(0, 50 ** 2 - (y - 50) ** 2))} ry="3" fill="none" stroke="rgba(180,162,255,0.14)" strokeWidth="0.3" />
            ))}
            <ellipse cx="50" cy="50" rx="18" ry="50" fill="none" stroke="rgba(180,162,255,0.1)" strokeWidth="0.3" />
          </svg>
        </div>
        <div className="absolute inset-0 rounded-full ring-1 ring-accent-2/30" />
        {inView && (
          <svg key={k} viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible" fill="none" aria-hidden>
            <defs>
              <linearGradient id="arc-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#8b6cff" />
                <stop offset="1" stopColor="#efe9ff" />
              </linearGradient>
            </defs>
            {arcs.map((a, i) => (
              <g key={i}>
                <motion.path d={a.d} stroke="url(#arc-g)" strokeWidth="0.7" strokeLinecap="round" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }} transition={{ delay: 0.8 + i * 0.35, duration: 2.6, times: [0, 0.45, 1] }} />
                <motion.circle cx={a.end[0]} cy={a.end[1]} r="1.3" fill="#efe9ff" initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 1] }} transition={{ delay: 1.9 + i * 0.35, duration: 0.5 }} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
                <motion.circle cx={a.end[0]} cy={a.end[1]} r="1.3" stroke="#b4a2ff" strokeWidth="0.4" initial={{ scale: 1, opacity: 0 }} animate={{ scale: [1, 4.5], opacity: [0.9, 0] }} transition={{ delay: 1.9 + i * 0.35, duration: 1.2 }} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
              </g>
            ))}
            <circle cx="50" cy="52" r="2" fill="#8b6cff" />
            <motion.circle cx="50" cy="52" r="2" stroke="#8b6cff" strokeWidth="0.5" animate={{ scale: [1, 5], opacity: [0.9, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
          </svg>
        )}
        {[
          { l: "Wydajność", v: 100, c: "top-[4%] -left-[16%] max-sm:-top-[10%] max-sm:-left-[20%]" },
          { l: "SEO", v: 100, c: "bottom-[8%] -left-[20%] max-sm:-bottom-[8%] max-sm:left-auto max-sm:-right-[18%]" },
          { l: "Dostępność", v: 98, c: "top-[22%] -right-[14%] max-sm:hidden" },
        ].map((s, i) => (
          <motion.div
            key={s.l}
            className={`absolute flex items-center gap-2 rounded-2xl border border-white/10 bg-bg/85 py-1.5 pr-3 pl-1.5 text-[12px] text-muted ${s.c}`}
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3 + i * 0.6, ease: "easeInOut" }}
          >
            <span className="grid size-8 place-items-center rounded-xl bg-emerald-400/15 text-[12px] font-medium text-emerald-200 tabular-nums">{inView ? <Count key={k} to={s.v} delay={0.6 + i * 0.2} /> : 0}</span>
            {s.l}
          </motion.div>
        ))}
      </div>
      <motion.div
        key={`live-${k}`}
        className="absolute top-6 right-6 flex items-center gap-2.5 rounded-full border border-emerald-400/30 bg-bg/80 py-2 pr-4 pl-3 text-[13px] text-emerald-100 sm:top-8 sm:right-8"
        initial={{ opacity: 0, y: -8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 2.2, type: "spring", stiffness: 260, damping: 20 }}
      >
        <span className="relative flex size-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400" />
          <span className="relative size-2 rounded-full bg-emerald-400" />
        </span>
        twojafirma.pl jest online
      </motion.div>
    </div>
  );
}
