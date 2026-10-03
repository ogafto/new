"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ease, Icon, ICONS } from "../kit";

/* Drobne klocki wspólne dla Zapytań, Klientów i Kalendarza. */

const noop = () => () => {};
export const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

// Okna i menu przez portal — przodkowie z transform/backdrop-filter „łapią” elementy fixed
export function Portal({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  return mounted ? createPortal(children, document.body) : null;
}

export function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  return (p.length > 1 ? p[0][0] + p[p.length - 1][0] : p[0].slice(0, 2)).toUpperCase();
}

const hue = (s: string) => {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
};

export function Avatar({ name, size = 36, className = "" }: { name: string; size?: number; className?: string }) {
  const h = hue(name);
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-medium tracking-[0.02em] ring-1 ring-white/[0.08] ring-inset ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        background: `linear-gradient(140deg, hsl(${h} 65% 62% / 0.3), hsl(${(h + 50) % 360} 60% 45% / 0.1))`,
        color: `hsl(${h} 85% 86%)`,
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

// „5 min”, „3 h”, „wczoraj”, „4 dni”, potem data
export function ago(ms: number, now: number) {
  const m = Math.floor((now - ms) / 60000);
  if (m < 1) return "teraz";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "wczoraj";
  if (d < 7) return `${d} dni`;
  return new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", timeZone: "Europe/Warsaw" }).format(ms);
}

// aktualne „teraz” odświeżane co minutę (start z wartości z serwera — bez rozjazdu hydratacji)
export function useNow(initial: number) {
  const [now, setNow] = useState(initial);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l");

export function Search({ value, onChange, placeholder = "Szukaj…", className = "", inputRef }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; inputRef?: React.Ref<HTMLInputElement> }) {
  return (
    <label className={`group relative flex h-9 items-center ${className}`}>
      <Icon d={ICONS.search} className="pointer-events-none absolute left-3 size-4 text-dim transition-colors group-focus-within:text-accent-2" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-full w-full rounded-full border border-line bg-white/[0.025] pr-8 pl-9 text-[13.5px] text-ink outline-none transition-[border-color,box-shadow,background-color] duration-300 placeholder:text-dim hover:border-line-2 focus:border-accent/70 focus:bg-white/[0.04] focus:shadow-[0_0_0_4px_rgb(139_108_255/0.1)]"
      />
      {value && (
        <button type="button" onClick={() => onChange("")} className="absolute right-2 grid size-5 place-items-center rounded-full text-dim hover:bg-white/10 hover:text-ink" aria-label="Wyczyść">
          <Icon d={ICONS.close} className="size-3" />
        </button>
      )}
    </label>
  );
}

export function CopyBtn({ text, label = "Kopiuj", className = "" }: { text: string; label?: string; className?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard?.writeText(text).then(() => {
          setOk(true);
          setTimeout(() => setOk(false), 1400);
        });
      }}
      className={`grid size-7 shrink-0 place-items-center rounded-full text-dim transition-colors hover:bg-white/[0.08] hover:text-ink ${className}`}
      aria-label={label}
      title={ok ? "Skopiowano" : label}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={ok ? "ok" : "copy"} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.15 }}>
          <Icon d={ok ? ICONS.check : ICONS.copy} className={`size-3.5 ${ok ? "text-emerald-300" : ""}`} />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

// Przełącznik segmentowy z kolorową kropką
export function Segmented<T extends string>({ value, onChange, items, id, disabled, size = "md", grid = false }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; dot?: string; count?: number }[]; id: string; disabled?: boolean; size?: "sm" | "md"; grid?: boolean }) {
  return (
    <div className={`max-w-full gap-0.5 rounded-xl border border-line bg-white/[0.02] p-1 [scrollbar-width:none] ${grid ? "grid grid-cols-2 sm:inline-flex sm:overflow-x-auto [&>button]:justify-center sm:[&>button]:justify-start" : "inline-flex overflow-x-auto"}`} role="radiogroup" data-lenis-prevent>
      {items.map((it) => {
        const on = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(it.value)}
            className={`relative flex shrink-0 items-center gap-2 rounded-[9px] whitespace-nowrap transition-colors disabled:cursor-wait ${size === "sm" ? "px-2.5 py-1 text-[12.5px]" : "px-3 py-1.5 text-[13px]"} ${on ? "text-ink" : "text-muted hover:text-ink"}`}
          >
            {on && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-[9px] bg-white/[0.09] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]" transition={{ type: "spring", stiffness: 480, damping: 38 }} />}
            {it.dot && <span className={`relative size-1.5 rounded-full ${it.dot} ${on ? "" : "opacity-60"}`} />}
            <span className="relative">{it.label}</span>
            {it.count !== undefined && <span className="relative text-[11.5px] text-dim tabular-nums">{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export type MenuItem = { label: string; icon?: string; onSelect?: () => void; href?: string; danger?: boolean; external?: boolean } | "sep";

// Menu akcji (⋯) — pozycjonowane względem przycisku, przez portal
export function Menu({ items, label = "Więcej", className = "" }: { items: MenuItem[]; label?: string; className?: string }) {
  const btn = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);

  useEffect(() => {
    if (!pos) return;
    const close = (e: Event) => {
      if (e.type === "pointerdown" && (box.current?.contains(e.target as Node) || btn.current?.contains(e.target as Node))) return;
      setPos(null);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setPos(null);
    addEventListener("pointerdown", close);
    addEventListener("resize", close);
    addEventListener("scroll", close, true);
    addEventListener("keydown", key);
    return () => {
      removeEventListener("pointerdown", close);
      removeEventListener("resize", close);
      removeEventListener("scroll", close, true);
      removeEventListener("keydown", key);
    };
  }, [pos]);

  const toggle = () => {
    if (pos) return setPos(null);
    const r = btn.current!.getBoundingClientRect();
    const h = items.length * 38 + 16;
    const right = Math.max(8, innerWidth - r.right);
    setPos(r.bottom + h > innerHeight - 96 && r.top > h ? { bottom: innerHeight - r.top + 6, right } : { top: r.bottom + 6, right });
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={!!pos}
        className={`grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-white/[0.07] hover:text-ink ${pos ? "bg-white/[0.07] text-ink" : ""} ${className}`}
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>
      <Portal>
        <AnimatePresence>
          {pos && (
            <motion.div
              ref={box}
              role="menu"
              className="edge fixed z-[85] w-[220px] overflow-hidden rounded-2xl bg-surface p-1.5 shadow-[0_30px_70px_-20px_rgb(0_0_0/0.95)]"
              style={pos}
              initial={{ opacity: 0, scale: 0.96, y: pos.top !== undefined ? -4 : 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18, ease }}
            >
              {items.map((it, i) => {
                if (it === "sep") return <div key={`s${i}`} className="my-1 h-px bg-line" />;
                const cls = `flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13.5px] transition-colors ${it.danger ? "text-red-300 hover:bg-red-400/10" : "text-ink/90 hover:bg-white/[0.06]"}`;
                const inner = (
                  <>
                    {it.icon && <Icon d={it.icon} className={`size-4 ${it.danger ? "" : "text-dim"}`} />}
                    {it.label}
                  </>
                );
                return it.href ? (
                  <a key={it.label} role="menuitem" href={it.href} target={it.external ? "_blank" : undefined} rel={it.external ? "noreferrer" : undefined} className={cls} onClick={() => setPos(null)}>
                    {inner}
                  </a>
                ) : (
                  <button
                    key={it.label}
                    role="menuitem"
                    type="button"
                    className={cls}
                    onClick={() => {
                      setPos(null);
                      it.onSelect?.();
                    }}
                  >
                    {inner}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}

// Pasek etapu 1–5
export function StageBar({ stage, stages, compact = false }: { stage: number; stages: string[]; compact?: boolean }) {
  const done = stage >= stages.length - 1;
  return (
    <div className="min-w-0">
      <div className="flex gap-[3px]" aria-hidden>
        {stages.map((s, i) => (
          <motion.span
            key={s}
            className={`h-1.5 flex-1 origin-left rounded-full ${i <= stage ? (done ? "bg-emerald-400" : i === stage ? "bg-accent-2" : "bg-accent") : "bg-white/[0.08]"}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.5, ease }}
          />
        ))}
      </div>
      <p className={`mt-1.5 flex items-baseline gap-1.5 truncate ${compact ? "text-[12px]" : "text-[12.5px]"}`}>
        <span className={done ? "text-emerald-200" : "text-ink/90"}>{stages[stage] ?? "—"}</span>
        <span className="text-dim tabular-nums">
          {Math.min(stage + 1, stages.length)}/{stages.length}
        </span>
      </p>
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="inline-grid h-5 min-w-5 place-items-center rounded-md border border-line-2 bg-white/[0.03] px-1 font-sans text-[11px] text-muted">{children}</kbd>;
}
