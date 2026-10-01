"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { MARK, STROKE } from "@/lib/logo";

/*
 * Ilustracje etapów procesu — generatywne sceny w stylu strony (linie + światło),
 * rysowane na canvasie / w SVG. Grają tylko, gdy są widoczne.
 */

const ease = [0.16, 1, 0.3, 1] as const;
const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

// canvas dopasowany do rozmiaru i gęstości pikseli, pętla tylko na ekranie
function useCanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void) {
  const ref = useRef<HTMLCanvasElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const fn = useRef(draw);
  useEffect(() => {
    fn.current = draw;
  });
  useEffect(() => {
    const c = ref.current;
    if (!c || !inView) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    const size = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width;
      h = r.height;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(c);
    const start = performance.now();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const loop = (now: number) => {
      fn.current(ctx, w, h, reduce ? 4 : (now - start) / 1000);
      if (!reduce) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [inView]);
  return { ref, inView };
}

function Caption({ children }: { children: React.ReactNode }) {
  return <span className="pointer-events-none absolute bottom-4 left-5 text-[11.5px] tracking-[0.02em] text-dim">{children}</span>;
}

/* ---------- 1. Rozmowa: dwa głosy, które na zmianę mówią i się słuchają ---------- */

const words = ["więcej klientów", "rezerwacje online", "budżet", "termin", "konkurencja", "styl marki", "telefon", "cel"];

export function TalkArt() {
  const sparks = useRef<{ x: number; y: number; vx: number; vy: number; life: number; v: boolean }[]>([]);
  const [chips, setChips] = useState<{ id: number; text: string; x: number }[]>([]);
  const { ref, inView } = useCanvas((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const mid = h * 0.52;
    // kto mówi: na zmianę co ~2,6 s, z płynnym przejściem
    const phase = (t % 5.2) / 5.2;
    const a = smooth(Math.sin(phase * Math.PI * 2) * 2.2 + 0.5);
    const b = 1 - a;
    const waves = [
      { amp: 0.12 + a * 0.88, color: [239, 237, 245], k: 1, sp: 1.3 },
      { amp: 0.12 + b * 0.88, color: [139, 108, 255], k: 1.35, sp: -1.1 },
    ];
    ctx.lineCap = "round";
    for (const [wi, wv] of waves.entries()) {
      for (const pass of [0, 1]) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 3) {
          const u = x / w;
          const env = Math.sin(u * Math.PI) ** 1.6;
          const y =
            mid +
            env *
              wv.amp *
              h *
              0.22 *
              (Math.sin(u * 14 * wv.k + t * 3 * wv.sp) * 0.55 + Math.sin(u * 31 * wv.k - t * 4.1 * wv.sp) * 0.25 + Math.sin(u * 6 + t * 1.3 + wi) * 0.35) *
              (pass ? -0.45 : 1);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const [r, g, bl] = wv.color;
        ctx.strokeStyle = `rgba(${r},${g},${bl},${pass ? 0.18 : 0.35 + wv.amp * 0.6})`;
        ctx.lineWidth = pass ? 1 : 1.6 + wv.amp;
        ctx.shadowColor = `rgba(${r},${g},${bl},0.8)`;
        ctx.shadowBlur = pass ? 0 : 14 * wv.amp;
        ctx.stroke();
      }
      // iskry z mówiącej fali
      if (wv.amp > 0.7 && Math.random() < 0.35) {
        const x = w * (0.2 + Math.random() * 0.6);
        sparks.current.push({ x, y: mid, vx: (Math.random() - 0.5) * 0.4, vy: -0.4 - Math.random() * 0.9, life: 1, v: wi === 1 });
      }
    }
    ctx.shadowBlur = 0;
    sparks.current = sparks.current.filter((s) => s.life > 0);
    for (const s of sparks.current) {
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.012;
      ctx.fillStyle = s.v ? `rgba(180,162,255,${s.life * 0.9})` : `rgba(239,237,245,${s.life * 0.7})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    // linia środka
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(0, mid, w, 1);
  });

  // słowa-klucze wypływające z rozmowy
  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const t = setInterval(() => {
      const id = Date.now();
      setChips((c) => [...c.slice(-3), { id, text: words[i++ % words.length], x: 12 + Math.random() * 56 }]);
    }, 1300);
    return () => clearInterval(t);
  }, [inView]);

  return (
    <div className="absolute inset-0">
      <canvas ref={ref} className="absolute inset-0 size-full" aria-hidden />
      <div className="absolute top-5 left-5 flex items-center gap-4 text-[12px] text-muted">
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-ink" />
          Ty
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-accent shadow-[0_0_10px_#8b6cff]" />
          afto.
        </span>
      </div>
      <AnimatePresence>
        {chips.map((c) => (
          <motion.span
            key={c.id}
            className="absolute top-[38%] rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[12px] whitespace-nowrap text-ink/80 backdrop-blur-md"
            style={{ left: `${c.x}%` }}
            initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
            animate={{ opacity: [0, 1, 1, 0], y: -90, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4.2, ease: "easeOut", times: [0, 0.15, 0.7, 1] }}
          >
            {c.text}
          </motion.span>
        ))}
      </AnimatePresence>
      <Caption>słucham · pytam · notuję</Caption>
    </div>
  );
}

/* ---------- 2. Kierunek: chaos linii układa się w jeden kierunek ---------- */

export function DirectionArt() {
  const { ref } = useCanvas((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const gap = Math.max(16, w / 30);
    const cycle = 8;
    const p = (t % cycle) / cycle;
    // 0–0.12 chaos, 0.12–0.45 linie zwracają się ku jednemu punktowi, 0.45–0.82 porządek, potem rozpad
    const k = p < 0.12 ? 0 : p < 0.45 ? smooth((p - 0.12) / 0.33) : p < 0.82 ? 1 : 1 - smooth((p - 0.82) / 0.18);
    const fx = w * 0.78;
    const fy = h * 0.32;
    const maxD = Math.hypot(w, h);
    ctx.lineCap = "round";
    for (let y = gap / 2; y < h; y += gap) {
      for (let x = gap / 2; x < w; x += gap) {
        const noise = Math.sin(x * 0.045 + t * 0.6) * 1.7 + Math.cos(y * 0.05 - t * 0.5) * 1.5 + Math.sin((x + y) * 0.02 + t * 0.35) * 1.2;
        const dist = Math.hypot(fx - x, fy - y);
        // fala porządkowania rozchodzi się od punktu docelowego
        const local = smooth(k * 1.7 - (dist / maxD) * 0.9);
        const target = Math.atan2(fy - y, fx - x);
        let d = target - noise;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        const ang = noise + d * local;
        const near = 1 - Math.min(1, dist / (maxD * 0.55));
        const len = gap * (0.32 + local * (0.25 + near * 0.35));
        const dx = (Math.cos(ang) * len) / 2;
        const dy = (Math.sin(ang) * len) / 2;
        const r = Math.round(110 + local * (60 + near * 60));
        const g = Math.round(108 + local * (near * 70));
        const b = Math.round(125 + local * 130);
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.18 + local * (0.35 + near * 0.45)})`;
        ctx.lineWidth = 1.1 + local * near * 1.4;
        ctx.beginPath();
        ctx.moveTo(x - dx, y - dy);
        ctx.lineTo(x + dx, y + dy);
        ctx.stroke();
      }
    }
    // punkt docelowy — świeci, gdy wszystko się ułoży
    const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, 70 + k * 40);
    glow.addColorStop(0, `rgba(200,188,255,${0.55 * k})`);
    glow.addColorStop(1, "rgba(139,108,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(fx - 120, fy - 120, 240, 240);
    ctx.fillStyle = `rgba(255,255,255,${0.3 + k * 0.7})`;
    ctx.beginPath();
    ctx.arc(fx, fy, 2.5 + k * 1.5 + Math.sin(t * 4) * 0.6 * k, 0, Math.PI * 2);
    ctx.fill();
    // kometa lecąca do celu
    if (k > 0.9) {
      const q = smooth(Math.min(1, ((t % cycle) / cycle - 0.45) / 0.3));
      const sx = w * 0.05;
      const sy = h * 0.9;
      const cx = sx + (fx - sx) * q;
      const cy = sy + (fy - sy) * q;
      const ang = Math.atan2(fy - sy, fx - sx);
      const grad = ctx.createLinearGradient(cx - Math.cos(ang) * 150, cy - Math.sin(ang) * 150, cx, cy);
      grad.addColorStop(0, "rgba(139,108,255,0)");
      grad.addColorStop(1, `rgba(230,224,255,${1 - q * 0.6})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#8b6cff";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(ang) * 150, cy - Math.sin(ang) * 150);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  });
  return (
    <div className="absolute inset-0">
      <canvas ref={ref} className="absolute inset-0 size-full" aria-hidden />
      <Caption>z wielu pomysłów — jeden kierunek</Caption>
    </div>
  );
}

/* ---------- 3. Projekt: konstrukcja znaku na siatce, jak w narzędziu projektowym ---------- */

export function DesignArt() {
  const box = useRef<HTMLDivElement>(null);
  const inView = useInView(box, { margin: "-10% 0px" });
  const [k, setK] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setK((x) => x + 1), 8000);
    return () => clearInterval(t);
  }, [inView]);
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
    <div ref={box} className="absolute inset-0">
      {inView && (
        <svg key={k} viewBox="-14 -2 72 54" className="absolute inset-0 size-full" fill="none" aria-hidden>
          <defs>
            <pattern id="d-grid" width="4" height="4" patternUnits="userSpaceOnUse">
              <path d="M4 0H0V4" stroke="rgba(255,255,255,0.05)" strokeWidth="0.15" />
            </pattern>
            <radialGradient id="d-glow">
              <stop offset="0" stopColor="#8b6cff" stopOpacity="0.35" />
              <stop offset="1" stopColor="#8b6cff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <motion.rect x="-14" y="-2" width="72" height="54" fill="url(#d-grid)" {...fade(0)} />
          <motion.circle cx="22" cy="28" r="26" fill="url(#d-glow)" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.6] }} transition={{ delay: 4.2, duration: 1.6 }} />
          {/* linie pomocnicze */}
          {[
            ["M-14 42.5H58", 0.3],
            ["M-14 22H58", 0.4],
            ["M-14 10H58", 0.5],
            ["M25 -2V52", 0.45],
            ["M16 -2V52", 0.55],
          ].map(([d, dl]) => (
            <motion.path key={d as string} d={d as string} stroke="#8b6cff" strokeOpacity="0.35" strokeWidth="0.18" strokeDasharray="0.8 0.8" {...draw(dl as number, 1.2)} />
          ))}
          {/* okręgi konstrukcyjne */}
          <motion.circle cx={c.cx} cy={c.cy} r={c.r + STROKE / 2} stroke="rgba(255,255,255,0.25)" strokeWidth="0.15" strokeDasharray="0.6 0.6" {...draw(0.9, 1.2)} />
          <motion.circle cx={c.cx} cy={c.cy} r={c.r - STROKE / 2} stroke="rgba(255,255,255,0.25)" strokeWidth="0.15" strokeDasharray="0.6 0.6" {...draw(1.05, 1.2)} />
          <motion.circle cx="32" cy="17" r="7" stroke="rgba(180,162,255,0.4)" strokeWidth="0.15" strokeDasharray="0.6 0.6" {...draw(1.2, 1)} />
          {/* wymiary */}
          <motion.g {...fade(1.8)}>
            <path d="M7 47.5H25" stroke="#b4a2ff" strokeWidth="0.15" />
            <path d="M7 46.8v1.4M25 46.8v1.4" stroke="#b4a2ff" strokeWidth="0.15" />
            <rect x="12.2" y="46.4" width="7.6" height="2.2" rx="0.5" fill="#8b6cff" />
            <text x="16" y="48" textAnchor="middle" fontSize="1.3" fill="#fff" fontFamily="var(--font-satoshi)">
              18 px
            </text>
          </motion.g>
          {/* właściwy znak */}
          <motion.circle cx={c.cx} cy={c.cy} r={c.r} stroke="#efedf5" strokeWidth={STROKE} {...draw(2.2, 1.1)} />
          {MARK.paths.map((d, i) => (
            <motion.path key={d} d={d} stroke="#efedf5" strokeWidth={STROKE} {...draw(2.6 + i * 0.35, 1)} />
          ))}
          <motion.rect
            x={MARK.dot.x}
            y={MARK.dot.y}
            width={MARK.dot.size}
            height={MARK.dot.size}
            fill="#8b6cff"
            style={{ transformBox: "fill-box", transformOrigin: "center", filter: "drop-shadow(0 0 1.6px #8b6cff)" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1], opacity: 1 }}
            transition={{ delay: 3.9, duration: 0.7 }}
          />
          {/* punkty węzłowe i uchwyty (jak w narzędziu pióra) */}
          {nodes.map(([x, y], i) => (
            <motion.rect
              key={i}
              x={x - 0.7}
              y={y - 0.7}
              width="1.4"
              height="1.4"
              fill="#07070a"
              stroke="#8b6cff"
              strokeWidth="0.25"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 1, 0], scale: 1 }}
              transition={{ delay: 2.4 + i * 0.12, duration: 3.2, times: [0, 0.1, 0.8, 1] }}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
          ))}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ delay: 3, duration: 2.4, times: [0, 0.15, 0.8, 1] }}>
            <path d="M25 17L25 10.5M32 10H36" stroke="#8b6cff" strokeWidth="0.2" />
            <circle cx="25" cy="10.5" r="0.6" fill="#8b6cff" />
            <circle cx="36" cy="10" r="0.6" fill="#8b6cff" />
          </motion.g>
        </svg>
      )}
      <Caption>siatka · proporcje · detal</Caption>
    </div>
  );
}

/* ---------- 4. Wdrożenie: skok w nadprzestrzeń i start ---------- */

export function LaunchArt() {
  const stars = useRef<{ x: number; y: number; z: number; pz: number }[]>([]);
  const [live, setLive] = useState(false);
  const cycle = 7;
  const { ref, inView } = useCanvas((ctx, w, h, t) => {
    if (!stars.current.length) stars.current = Array.from({ length: 260 }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random(), pz: 0 }));
    const p = (t % cycle) / cycle;
    // przyspieszenie → szczyt → hamowanie
    const speed = p < 0.45 ? 0.002 + smooth(p / 0.45) * 0.05 : 0.052 * (1 - smooth((p - 0.45) / 0.25)) + 0.0015;
    ctx.fillStyle = `rgba(14,14,19,${p > 0.42 && p < 0.5 ? 0.25 : 0.55})`;
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    for (const s of stars.current) {
      s.pz = s.z;
      s.z -= speed;
      if (s.z <= 0.01) {
        s.x = Math.random() * 2 - 1;
        s.y = Math.random() * 2 - 1;
        s.z = 1;
        s.pz = 1;
      }
      const sx = cx + (s.x / s.z) * w * 0.35;
      const sy = cy + (s.y / s.z) * h * 0.35;
      const px = cx + (s.x / s.pz) * w * 0.35;
      const py = cy + (s.y / s.pz) * h * 0.35;
      const b = 1 - s.z;
      ctx.strokeStyle = Math.abs(s.x) < 0.3 ? `rgba(180,162,255,${b})` : `rgba(239,237,245,${b * 0.85})`;
      ctx.lineWidth = Math.max(0.6, b * 2.2);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }
    // błysk i fala po „starcie”
    if (p > 0.45) {
      const q = (p - 0.45) / 0.55;
      const r = smooth(q) * Math.max(w, h) * 0.7;
      ctx.strokeStyle = `rgba(139,108,255,${(1 - q) * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90);
      g.addColorStop(0, `rgba(180,162,255,${0.35 * (1 - q * 0.6)})`);
      g.addColorStop(1, "rgba(139,108,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(cx - 90, cy - 90, 180, 180);
    }
  });

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const t = setInterval(() => {
      const p = (((performance.now() - start) / 1000) % cycle) / cycle;
      setLive(p > 0.5 && p < 0.97);
    }, 200);
    return () => clearInterval(t);
  }, [inView]);

  return (
    <div className="absolute inset-0">
      <canvas ref={ref} className="absolute inset-0 size-full" aria-hidden />
      <AnimatePresence>
        {live && (
          <motion.div
            className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-full border border-emerald-400/30 bg-bg/70 py-2 pr-4 pl-3 text-[13px] whitespace-nowrap text-emerald-100 backdrop-blur-md"
            initial={{ opacity: 0, scale: 0.6, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400" />
              <span className="relative size-2 rounded-full bg-emerald-400" />
            </span>
            twojafirma.pl jest online
          </motion.div>
        )}
      </AnimatePresence>
      <Caption>kod · szybkość · start</Caption>
    </div>
  );
}
