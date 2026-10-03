"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Card, Count, Delta, ease, Icon, ICONS, spotMove, Spark } from "../kit";

/* Klocki widoków z danymi (Finanse, Analityka, Logi): wyszukiwarka, menu wiersza, panel boczny, KPI, komunikaty. */

const noop = () => () => {};
/** true dopiero po hydracji (portale nie mogą renderować się na serwerze) */
export const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

export const fmtInt = (n: number) => n.toLocaleString("pl-PL");

/* ---------- wyszukiwarka ---------- */
export function SearchField({ value, onChange, placeholder = "Szukaj…", className = "", onSubmit }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; onSubmit?: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, []);
  return (
    <form
      role="search"
      className={`group relative ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <Icon d={ICONS.search} className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-dim transition-colors group-focus-within:text-accent-2" />
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-full border border-white/[0.08] bg-white/[0.03] pr-9 pl-9 text-[13.5px] text-ink outline-none transition-[border-color,box-shadow,background-color] duration-300 placeholder:text-dim hover:border-white/[0.16] focus:border-accent/70 focus:bg-white/[0.04] focus:shadow-[0_0_0_4px_rgb(139_108_255/0.12)]"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange("");
            ref.current?.focus();
          }}
          className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-dim transition-colors hover:bg-white/[0.08] hover:text-ink"
          aria-label="Wyczyść"
        >
          <Icon d={ICONS.close} className="size-3.5" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded-md border border-white/[0.1] px-1.5 font-mono text-[10.5px] leading-[18px] text-dim sm:block">/</kbd>
      )}
    </form>
  );
}

/* ---------- przełącznik segmentowy (kompaktowy, z licznikami) ---------- */
export function Segmented<T extends string>({ value, onChange, items, id, size = "sm" }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; count?: number; dot?: string }[]; id: string; size?: "sm" | "md" }) {
  return (
    <div className="inline-flex max-w-full gap-0.5 overflow-x-auto rounded-full border border-white/[0.07] bg-white/[0.02] p-[3px] [scrollbar-width:none]" data-lenis-prevent role="tablist">
      {items.map((it) => {
        const on = value === it.value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(it.value)}
            className={`relative flex shrink-0 items-center gap-1.5 rounded-full whitespace-nowrap transition-colors ${size === "sm" ? "h-[30px] px-3 text-[12.5px]" : "h-9 px-4 text-[13.5px]"} ${on ? "text-ink" : "text-muted hover:text-ink"}`}
          >
            {on && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-full bg-white/[0.09] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]" transition={{ type: "spring", stiffness: 480, damping: 38 }} />}
            {it.dot && <span className={`relative size-1.5 rounded-full ${it.dot}`} />}
            <span className="relative">{it.label}</span>
            {it.count !== undefined && <span className={`relative tabular-nums ${on ? "text-muted" : "text-dim"}`}>{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- menu akcji wiersza (portal, nie ucina go karta) ---------- */
export type MenuItem = { label: string; icon: string; onSelect: () => void; tone?: "danger"; disabled?: boolean; hidden?: boolean; sep?: boolean };

export function RowMenu({ items, label = "Akcje" }: { items: MenuItem[]; label?: string }) {
  const btn = useRef<HTMLButtonElement>(null);
  const mounted = useMounted();
  const [pos, setPos] = useState<{ top: number; left: number; up: boolean } | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const close = useCallback(() => {
    setPos(null);
    setArmed(null);
  }, []);
  const shown = items.filter((i) => !i.hidden);
  useEffect(() => {
    if (!pos) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    addEventListener("keydown", k);
    addEventListener("scroll", close, true);
    addEventListener("resize", close);
    return () => {
      removeEventListener("keydown", k);
      removeEventListener("scroll", close, true);
      removeEventListener("resize", close);
    };
  }, [pos, close]);
  const open = () => {
    const r = btn.current!.getBoundingClientRect();
    const h = shown.length * 38 + 12;
    const up = r.bottom + h + 12 > innerHeight - 90 && r.top > h + 12;
    setPos({ top: up ? r.top - 6 : r.bottom + 6, left: Math.max(12, Math.min(r.right - 220, innerWidth - 232)), up });
  };
  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (pos) close();
          else open();
        }}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={!!pos}
        className={`grid size-8 place-items-center rounded-lg transition-colors ${pos ? "bg-white/[0.1] text-ink" : "text-dim hover:bg-white/[0.07] hover:text-ink"}`}
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {pos && (
              <>
                <div className="fixed inset-0 z-[84]" onClick={close} onContextMenu={(e) => (e.preventDefault(), close())} />
                <motion.div
                  role="menu"
                  className="fixed z-[85] w-[220px] rounded-2xl border border-white/[0.1] bg-[rgb(20_20_28/0.96)] p-1.5 shadow-[0_24px_60px_-12px_rgb(0_0_0/0.85),inset_0_1px_0_rgb(255_255_255/0.06)] backdrop-blur-xl"
                  style={{ left: pos.left, top: pos.top, translateY: pos.up ? "-100%" : 0 }}
                  initial={{ opacity: 0, scale: 0.96, y: pos.up ? 6 : -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.22, ease }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {shown.map((it) => (
                    <div key={it.label}>
                      {it.sep && <div className="mx-2 my-1 h-px bg-white/[0.07]" />}
                      <button
                        type="button"
                        role="menuitem"
                        disabled={it.disabled}
                        onClick={() => {
                          if (it.tone === "danger" && armed !== it.label) return setArmed(it.label);
                          close();
                          it.onSelect();
                        }}
                        className={`flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[13px] transition-colors disabled:opacity-40 ${it.tone === "danger" ? (armed === it.label ? "bg-red-400/15 text-red-200" : "text-red-300 hover:bg-red-400/10") : "text-muted hover:bg-white/[0.06] hover:text-ink"}`}
                      >
                        <Icon d={it.icon} className="size-4 shrink-0" />
                        {it.tone === "danger" && armed === it.label ? "Kliknij, aby potwierdzić" : it.label}
                      </button>
                    </div>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

/* ---------- panel boczny (desktop) / arkusz od dołu (telefon) ---------- */
export function Drawer({ open, onClose, title, sub, children, footer }: { open: boolean; onClose: () => void; title: React.ReactNode; sub?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }) {
  const mounted = useMounted();
  const [mobile, setMobile] = useState(false);
  useLayoutEffect(() => {
    const m = matchMedia("(max-width: 767px)");
    const set = () => setMobile(m.matches);
    set();
    m.addEventListener("change", set);
    return () => m.removeEventListener("change", set);
  }, []);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", k);
    const o = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      removeEventListener("keydown", k);
      document.documentElement.style.overflow = o;
    };
  }, [open, onClose]);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <div className="absolute inset-0 bg-[rgb(4_4_6/0.6)] backdrop-blur-[3px]" onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            data-lenis-prevent
            className="absolute flex flex-col overflow-hidden border-white/[0.09] bg-[linear-gradient(180deg,rgb(20_20_28/0.97),rgb(11_11_16/0.98))] shadow-[0_30px_100px_-20px_rgb(0_0_0/0.95),inset_0_1px_0_rgb(255_255_255/0.06)] backdrop-blur-2xl max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[90svh] max-md:rounded-t-[26px] max-md:border-t md:top-3 md:right-3 md:bottom-3 md:w-[460px] md:rounded-[26px] md:border"
            initial={mobile ? { y: "100%" } : { x: "105%" }}
            animate={mobile ? { y: 0 } : { x: 0 }}
            exit={mobile ? { y: "100%" } : { x: "105%" }}
            transition={{ duration: 0.42, ease }}
          >
            <div className="pointer-events-none absolute -top-28 -right-20 size-72 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.18),transparent)]" aria-hidden />
            <span className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/15 md:hidden" aria-hidden />
            <header className="relative flex items-start justify-between gap-4 px-6 pt-5 pb-4 md:pt-6">
              <div className="min-w-0">
                <h2 className="text-[18px] leading-snug font-medium tracking-[-0.015em]">{title}</h2>
                {sub && <div className="mt-1 text-[13px] text-dim">{sub}</div>}
              </div>
              <button type="button" onClick={onClose} className="-mr-2 grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-ink" aria-label="Zamknij">
                <Icon d={ICONS.close} className="size-4" />
              </button>
            </header>
            <div className="relative min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
            {footer && <footer className="relative border-t border-white/[0.07] px-6 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)] md:pb-4">{footer}</footer>}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ---------- kafel KPI ze sparkline ---------- */
export function Kpi({ label, value, suffix, decimals, prev, invert, spark, hint, icon, delay = 0, tone, accent }: { label: string; value: number; suffix?: string; decimals?: number; prev?: number; invert?: boolean; spark?: number[]; hint?: React.ReactNode; icon?: string; delay?: number; tone?: string; accent?: boolean }) {
  return (
    <Card delay={delay} glow={accent} className="group" pad={false}>
      <div className="flex h-full flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="flex min-w-0 items-center gap-2 text-[13px] text-muted">
            {icon && <Icon d={icon} className="size-4 shrink-0 text-dim transition-colors duration-500 group-hover:text-accent-2 max-sm:hidden" />}
            <span className="truncate">{label}</span>
          </p>
          {prev !== undefined && (
            <span className="max-sm:hidden">
              <Delta cur={value} prev={prev} invert={invert} />
            </span>
          )}
        </div>
        <div className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <Count value={value} suffix={suffix} decimals={decimals} className={`h-display block text-[24px] leading-none sm:text-[32px] ${tone ?? ""}`} />
          {prev !== undefined && (
            <span className="sm:hidden">
              <Delta cur={value} prev={prev} invert={invert} />
            </span>
          )}
        </div>
        {hint && <div className="mt-2 text-[12.5px] text-dim">{hint}</div>}
        {spark && <Spark data={spark} className="mt-auto h-9 w-full pt-3" />}
      </div>
    </Card>
  );
}

/* ---------- komunikat (toast) ---------- */
export function useToast() {
  const [msg, setMsg] = useState<{ ok?: string; error?: string; k: number } | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3600);
    return () => clearTimeout(t);
  }, [msg]);
  const show = useCallback((m: { ok?: string; error?: string }) => {
    if (m.ok || m.error) setMsg({ ...m, k: Date.now() });
  }, []);
  const mounted = useMounted();
  const node =
    mounted
      ? createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+100px)] z-[95] flex justify-center px-4 lg:bottom-8">
            <AnimatePresence>
              {msg && (
                <motion.div
                  key={msg.k}
                  role="status"
                  className={`pointer-events-auto flex max-w-[min(440px,100%)] items-center gap-2.5 rounded-full border py-2 pr-4 pl-2 text-[13.5px] shadow-[0_20px_50px_-15px_rgb(0_0_0/0.9)] backdrop-blur-xl ${msg.error ? "border-red-400/25 bg-[rgb(40_14_18/0.92)] text-red-100" : "border-white/[0.1] bg-[rgb(20_20_28/0.94)] text-ink"}`}
                  initial={{ opacity: 0, y: 16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.35, ease }}
                >
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full ${msg.error ? "bg-red-400/20 text-red-200" : "bg-emerald-400/15 text-emerald-300"}`}>
                    <Icon d={msg.error ? ICONS.close : ICONS.check} className="size-3.5" />
                  </span>
                  <span className="min-w-0">{msg.error ?? msg.ok}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>,
          document.body,
        )
      : null;
  return { show, node };
}

/* ---------- nagłówek tabeli ---------- */
export function Th({ children, className = "", right }: { children?: React.ReactNode; className?: string; right?: boolean }) {
  return <th className={`h-10 px-3 text-[12.5px] font-normal whitespace-nowrap text-dim first:pl-5 last:pr-5 ${right ? "text-right" : "text-left"} ${className}`}>{children}</th>;
}

/* ---------- kafelek z poświatą pod kursorem (bez animacji wejścia) ---------- */
export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div onPointerMove={spotMove} className={`spot edge relative overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,rgb(22_22_30/0.82),rgb(13_13_18/0.82))] shadow-[0_1px_0_0_rgb(255_255_255/0.04)_inset,0_24px_60px_-40px_rgb(0_0_0/0.9)] ${className}`}>
      <div className="relative h-full">{children}</div>
    </div>
  );
}
