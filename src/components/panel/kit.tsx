"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { ICONS } from "./icons";

/* Wspólne klocki panelu: karty, liczniki, wykresy, przyciski, okna. */

export const ease = [0.16, 1, 0.3, 1] as const;

export function PageHead({ kicker, title, children }: { kicker?: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end lg:mb-10">
      <div className="min-w-0">
        {kicker && (
          <motion.p className="text-[13px] text-dim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            {kicker}
          </motion.p>
        )}
        <h1 className="h-display mt-2 overflow-hidden pb-[0.1em] text-[clamp(2rem,3.6vw,3rem)]">
          <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ duration: 0.9, ease }}>
            {title}
          </motion.span>
        </h1>
      </div>
      {children && (
        <motion.div className="flex flex-wrap items-center gap-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7, ease }}>
          {children}
        </motion.div>
      )}
    </div>
  );
}

export function Card({ children, className = "", delay = 0, glow = false, pad = true }: { children: React.ReactNode; className?: string; delay?: number; glow?: boolean; pad?: boolean }) {
  return (
    <motion.section
      className={`edge relative overflow-hidden rounded-[22px] bg-surface/80 ${pad ? "p-5 sm:p-6" : ""} ${className}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + delay, duration: 0.8, ease }}
    >
      {glow && <div className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.16),transparent)]" aria-hidden />}
      <div className="relative h-full">{children}</div>
    </motion.section>
  );
}

export function CardHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[16px] font-medium tracking-[-0.01em]">{title}</h2>
        {sub && <p className="mt-0.5 text-[13px] text-dim">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

// Liczba, która „dolicza się” przy pojawieniu
export function Count({ value, suffix = "", decimals = 0, className = "" }: { value: number; suffix?: string; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => `${v.toLocaleString("pl-PL", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}${suffix}`);
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, value, { duration: 1.4, ease });
    return () => c.stop();
  }, [inView, value, mv]);
  return (
    <motion.span ref={ref} className={`tabular-nums ${className}`}>
      {text}
    </motion.span>
  );
}

export function Delta({ cur, prev, invert = false }: { cur: number; prev: number; invert?: boolean }) {
  if (!prev && !cur) return <span className="text-[12px] text-dim">—</span>;
  const pct = prev ? Math.round(((cur - prev) / prev) * 100) : 100;
  const good = invert ? pct <= 0 : pct >= 0;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] tabular-nums ${good ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>
      <svg width="8" height="8" viewBox="0 0 8 8" className={pct >= 0 ? "" : "rotate-180"} aria-hidden>
        <path d="M4 1l3 4H1z" fill="currentColor" />
      </svg>
      {Math.abs(pct)}%
    </span>
  );
}

// Mały wykres liniowy
export function Spark({ data, className = "h-10 w-full" }: { data: number[]; className?: string }) {
  const gid = useId();
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => [(i / Math.max(1, data.length - 1)) * 100, 30 - (v / max) * 26 - 2]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b6cff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8b6cff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={`${line} L100,30 L0,30 Z`} fill={`url(#${gid})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} />
      <motion.path d={line} fill="none" stroke="#b4a2ff" strokeWidth="1.2" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease }} />
    </svg>
  );
}

export function Stat({ label, value, suffix, prev, spark, icon, delay = 0, invert, hint }: { label: string; value: number; suffix?: string; prev?: number; spark?: number[]; icon?: string; delay?: number; invert?: boolean; hint?: string }) {
  return (
    <Card delay={delay} className="group">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] text-muted">{label}</p>
        {icon && (
          <span className="grid size-8 place-items-center rounded-xl bg-white/[0.04] text-dim transition-colors duration-500 group-hover:text-accent-2">
            <Icon d={icon} className="size-4" />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-end gap-3">
        <Count value={value} suffix={suffix} className="h-display text-[38px] leading-none" />
        {prev !== undefined && <Delta cur={value} prev={prev} invert={invert} />}
      </div>
      {hint && <p className="mt-2 text-[12px] text-dim">{hint}</p>}
      {spark && <Spark data={spark} className="mt-4 h-10 w-full" />}
    </Card>
  );
}

// Duży wykres powierzchniowy z podpowiedzią po najechaniu
export function AreaChart({ data, label, unit = "day" }: { data: { t: number; a: number; b?: number }[]; label: [string, string?]; unit?: "day" | "hour" }) {
  const format = (ms: number) =>
    new Intl.DateTimeFormat("pl-PL", unit === "hour" ? { hour: "2-digit", minute: "2-digit" } : { weekday: "short", day: "numeric", month: "short" }).format(ms);
  const gid = useId();
  const [hover, setHover] = useState<number | null>(null);
  const W = 800;
  const H = 220;
  const max = Math.max(4, ...data.map((d) => Math.max(d.a, d.b ?? 0)));
  const x = (i: number) => (i / Math.max(1, data.length - 1)) * W;
  const y = (v: number) => H - 8 - (v / max) * (H - 30);
  const path = (k: "a" | "b") => data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d[k] ?? 0)}`).join(" ");
  const h = hover !== null ? data[hover] : null;
  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-[220px] w-full overflow-visible"
        preserveAspectRatio="none"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHover(Math.round(((e.clientX - r.left) / r.width) * (data.length - 1)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b6cff" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#8b6cff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1="0" x2={W} y1={y(max * g)} y2={y(max * g)} stroke="rgba(255,255,255,0.05)" vectorEffect="non-scaling-stroke" />
        ))}
        <motion.path d={`${path("a")} L${W},${H} L0,${H} Z`} fill={`url(#${gid})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.9 }} />
        {data[0]?.b !== undefined && (
          <motion.path d={path("b")} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} />
        )}
        <motion.path d={path("a")} fill="none" stroke="#b4a2ff" strokeWidth="2" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease }} />
        {h && hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1="0" y2={H} stroke="rgba(255,255,255,0.15)" vectorEffect="non-scaling-stroke" />
            <circle cx={x(hover)} cy={y(h.a)} r="4" fill="#8b6cff" stroke="#07070a" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
      <AnimatePresence>
        {h && hover !== null && (
          <motion.div
            className="pointer-events-none absolute top-0 z-10 rounded-xl border border-line-2 bg-bg/90 px-3 py-2 text-[12px] backdrop-blur"
            style={{ left: `clamp(0px, calc(${(hover / Math.max(1, data.length - 1)) * 100}% - 70px), calc(100% - 150px))` }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-dim">{format(h.t)}</p>
            <p className="mt-0.5 text-ink">
              {label[0]}: <span className="tabular-nums">{h.a}</span>
            </p>
            {h.b !== undefined && label[1] && (
              <p className="text-muted">
                {label[1]}: <span className="tabular-nums">{h.b}</span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Lista z poziomymi paskami (źródła, urządzenia…)
export function BarList({ items, unit = "", empty = "Brak danych" }: { items: { name: string; n: number; extra?: string }[]; unit?: string; empty?: string }) {
  const max = Math.max(1, ...items.map((i) => i.n));
  if (!items.length) return <p className="py-6 text-center text-[13px] text-dim">{empty}</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={it.name + i} className="relative overflow-hidden rounded-lg">
          <motion.span
            className="absolute inset-y-0 left-0 rounded-lg bg-accent/[0.14]"
            initial={{ width: 0 }}
            animate={{ width: `${(it.n / max) * 100}%` }}
            transition={{ delay: 0.1 + i * 0.05, duration: 1, ease }}
          />
          <span className="relative flex items-center justify-between gap-3 px-3 py-2 text-[13.5px]">
            <span className="truncate">{it.name}</span>
            <span className="shrink-0 text-muted tabular-nums">
              {it.extra && <span className="mr-2 text-dim">{it.extra}</span>}
              {it.n.toLocaleString("pl-PL")}
              {unit}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

// Lejek: kolejne kroki z procentem względem pierwszego
export function Funnel({ steps }: { steps: { name: string; n: number }[] }) {
  const first = Math.max(1, steps[0]?.n ?? 1);
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => {
        const pct = Math.round((s.n / first) * 100);
        return (
          <li key={s.name}>
            <div className="mb-1.5 flex items-baseline justify-between text-[13.5px]">
              <span>{s.name}</span>
              <span className="text-muted tabular-nums">
                {s.n.toLocaleString("pl-PL")} <span className="text-dim">· {i ? `${pct}%` : "100%"}</span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                initial={{ width: 0 }}
                animate={{ width: `${steps[0]?.n ? pct : 0}%` }}
                transition={{ delay: 0.15 + i * 0.12, duration: 1.1, ease }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function Icon({ d, className = "size-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export { ICONS };

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" | "danger"; size?: "sm" | "md"; icon?: string };
export function Btn({ variant = "outline", size = "md", icon, className = "", children, ...rest }: BtnProps) {
  const v = {
    primary: "bg-ink text-bg hover:bg-white",
    outline: "border border-line-2 text-ink hover:border-white/35 hover:bg-white/[0.03]",
    ghost: "text-muted hover:bg-white/[0.05] hover:text-ink",
    danger: "text-red-300 hover:bg-red-400/10",
  }[variant];
  const s = size === "sm" ? "h-9 px-3.5 text-[13px] gap-1.5" : "h-11 px-5 text-[14px] gap-2";
  return (
    <button {...rest} className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50 ${v} ${s} ${className}`}>
      {icon && <Icon d={icon} className={size === "sm" ? "size-4" : "size-[18px]"} />}
      {children}
    </button>
  );
}

// Dwa kliknięcia zamiast okienka potwierdzenia
export function ConfirmBtn({ onConfirm, children = "Usuń", label = "Na pewno?", size = "sm" }: { onConfirm: () => void; children?: React.ReactNode; label?: string; size?: "sm" | "md" }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <Btn
      type="button"
      variant="danger"
      size={size}
      icon={ICONS.trash}
      className={armed ? "!bg-red-400/15" : ""}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? label : children}
    </Btn>
  );
}

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            data-lenis-prevent
            className={`edge relative max-h-[92svh] w-full overflow-y-auto rounded-t-[26px] bg-surface p-6 sm:rounded-[26px] sm:p-8 ${wide ? "sm:max-w-[760px]" : "sm:max-w-[540px]"}`}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease }}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-[20px] font-medium tracking-[-0.02em]">{title}</h2>
              <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-white/5 hover:text-ink" aria-label="Zamknij">
                <Icon d={ICONS.close} className="size-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "accent" | "green" | "amber" | "red" | "sky" }) {
  const t = {
    default: "border-line-2 text-muted",
    accent: "border-accent/30 bg-accent/10 text-accent-2",
    green: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    amber: "border-amber-300/25 bg-amber-300/10 text-amber-200",
    red: "border-red-400/25 bg-red-400/10 text-red-200",
    sky: "border-sky-400/25 bg-sky-400/10 text-sky-200",
  }[tone];
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] whitespace-nowrap ${t}`}>{children}</span>;
}

export function Empty({ icon = ICONS.grid, title, text, children }: { icon?: string; title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="relative grid size-14 place-items-center rounded-2xl border border-line-2 text-accent-2">
        <span className="absolute inset-0 animate-ping rounded-2xl border border-accent/20 [animation-duration:2.4s]" />
        <Icon d={icon} className="size-6" />
      </span>
      <p className="mt-5 text-[16px]">{title}</p>
      {text && <p className="mt-1.5 max-w-sm text-[14px] text-dim">{text}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

export const field =
  "w-full rounded-xl border border-line-2 bg-white/[0.02] px-3.5 text-[14.5px] text-ink outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-dim hover:border-white/25 focus:border-accent focus:shadow-[0_0_0_4px_rgb(139_108_255/0.12)]";

export function Label({ label, children, hint, className = "" }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[13px] text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[12px] text-dim">{hint}</span>}
    </label>
  );
}

export function Toggle({ name, defaultChecked, checked, onChange, label }: { name?: string; defaultChecked?: boolean; checked?: boolean; onChange?: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-[14px]">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} checked={checked} onChange={(e) => onChange?.(e.target.checked)} className="peer sr-only" />
      <span className="relative h-6 w-10 rounded-full bg-white/10 transition-colors duration-300 peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/50 after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-white after:transition-transform after:duration-300 peer-checked:after:translate-x-4" />
      {label}
    </label>
  );
}

export function Tabs<T extends string>({ value, onChange, items, id }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; count?: number }[]; id: string }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full border border-line p-1">
      {items.map((it) => (
        <button key={it.value} type="button" onClick={() => onChange(it.value)} className={`relative rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${value === it.value ? "text-ink" : "text-muted hover:text-ink"}`}>
          {value === it.value && <motion.span layoutId={`tabs-${id}`} className="absolute inset-0 rounded-full bg-white/[0.08]" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
          <span className="relative">
            {it.label}
            {it.count !== undefined && <span className="ml-1.5 text-dim">{it.count}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
