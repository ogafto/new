"use client";

import { motion } from "motion/react";
import { Card, ease, Icon } from "../kit";

/* Układ „ustawień”: pionowa nawigacja sekcji (desktop) / przewijane chipy (telefon) + karty sekcji */

export type NavStatus = "ok" | "part" | "none" | "warn" | "dirty" | "off";
export type NavItem = { id: string; label: string; icon: string; status?: NavStatus; meta?: string };

const DOT: Record<NavStatus, string> = {
  ok: "bg-emerald-400 shadow-[0_0_8px_rgb(52_211_153/0.7)]",
  part: "bg-amber-300 shadow-[0_0_8px_rgb(252_211_77/0.6)]",
  warn: "bg-amber-300 shadow-[0_0_8px_rgb(252_211_77/0.6)]",
  none: "bg-white/20",
  off: "bg-white/20",
  dirty: "bg-accent-2 shadow-[0_0_10px_rgb(180_162_255/0.9)]",
};

function Dot({ s }: { s?: NavStatus }) {
  if (!s) return null;
  return (
    <span className="relative flex size-1.5 shrink-0">
      {(s === "dirty" || s === "warn") && <span className={`absolute inset-0 animate-ping rounded-full ${s === "dirty" ? "bg-accent-2/70" : "bg-amber-300/70"}`} />}
      <span className={`relative size-1.5 rounded-full ${DOT[s]}`} />
    </span>
  );
}

export function SectionNav({ id, items, active, onPick, footer }: { id: string; items: NavItem[]; active: string; onPick: (id: string) => void; footer?: React.ReactNode }) {
  return (
    <>
      {/* telefon / tablet: chipy */}
      <div className="sticky top-[calc(env(safe-area-inset-top)+61px)] z-30 -mx-4 mb-1 bg-[linear-gradient(180deg,rgb(7_7_10/0.96)_70%,rgb(7_7_10/0))] px-4 pt-2 pb-3 sm:-mx-8 sm:px-8 lg:hidden">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none]" data-lenis-prevent>
          {items.map((it) => {
            const on = active === it.id;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => onPick(it.id)}
                className={`relative flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] whitespace-nowrap transition-colors ${on ? "border-accent/35 text-ink" : "border-white/[0.08] bg-white/[0.02] text-muted"}`}
              >
                {on && <motion.span layoutId={`snav-m-${id}`} className="absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgb(139_108_255/0.2),rgb(139_108_255/0.06))]" transition={{ type: "spring", stiffness: 480, damping: 38 }} />}
                <Dot s={it.status} />
                <span className="relative">{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* desktop: pionowa lista */}
      <nav className="sticky top-[104px] hidden self-start lg:block" aria-label="Sekcje">
        <motion.ul className="space-y-0.5" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, ease }}>
          {items.map((it) => {
            const on = active === it.id;
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => onPick(it.id)}
                  aria-current={on ? "true" : undefined}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] transition-colors ${on ? "text-ink" : "text-muted hover:bg-white/[0.03] hover:text-ink"}`}
                >
                  {on && (
                    <motion.span layoutId={`snav-${id}`} className="absolute inset-0 rounded-xl border border-white/[0.07] bg-white/[0.05] shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]" transition={{ type: "spring", stiffness: 480, damping: 40 }}>
                      <span className="absolute top-1/2 left-0 h-4 w-[2px] -translate-y-1/2 rounded-full bg-accent-2 shadow-[0_0_10px_rgb(180_162_255/0.9)]" />
                    </motion.span>
                  )}
                  <Icon d={it.icon} className={`relative size-4 shrink-0 transition-colors ${on ? "text-accent-2" : "text-dim group-hover:text-muted"}`} />
                  <span className="relative min-w-0 flex-1 truncate">{it.label}</span>
                  {it.meta && <span className="relative text-[11.5px] text-dim tabular-nums">{it.meta}</span>}
                  <span className="relative">
                    <Dot s={it.status} />
                  </span>
                </button>
              </li>
            );
          })}
        </motion.ul>
        {footer && <div className="mt-5 border-t border-white/[0.06] pt-4">{footer}</div>}
      </nav>
    </>
  );
}

/* Karta sekcji: nagłówek, treść, stopka z akcjami (jak w ustawieniach Vercela) */
export function SectionCard({
  id,
  icon,
  title,
  text,
  badge,
  children,
  footer,
  delay = 0,
  glow = false,
  className = "",
}: {
  id?: string;
  icon?: string;
  title: React.ReactNode;
  text?: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  delay?: number;
  glow?: boolean;
  className?: string;
}) {
  return (
    <div id={id} className={`min-w-0 scroll-mt-[136px] lg:scroll-mt-[104px] ${className}`}>
      <Card pad={false} delay={delay} glow={glow}>
        <header className="flex items-start gap-3.5 px-5 pt-5 sm:px-6 sm:pt-6">
          {icon && (
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-[linear-gradient(180deg,rgb(255_255_255/0.06),rgb(255_255_255/0.02))] text-accent-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]">
              <Icon d={icon} className="size-[18px]" />
            </span>
          )}
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="text-[16px] font-medium tracking-[-0.01em]">{title}</h2>
            {text && <p className="mt-0.5 text-[13px] leading-relaxed text-dim">{text}</p>}
          </div>
          {badge && <div className="shrink-0 pt-0.5">{badge}</div>}
        </header>
        {children && <div className="px-5 py-5 sm:px-6">{children}</div>}
        {footer && <footer className="flex flex-col gap-3 border-t border-white/[0.06] bg-white/[0.015] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">{footer}</footer>}
      </Card>
    </div>
  );
}

/* Wiersz pola: etykieta + podpowiedź po lewej, kontrolka po prawej (od sm) */
export function FieldRow({ label, htmlFor, hint, aside, children }: { label: string; htmlFor?: string; hint?: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] sm:gap-6">
      <div className="min-w-0 sm:pt-2.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <label htmlFor={htmlFor} className="text-[13.5px] text-ink">
            {label}
          </label>
          {aside}
        </div>
        {hint && <p className="mt-1 text-[12px] leading-relaxed text-dim">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* Wiadomość wyniku (zapis / test) */
export function Note({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <motion.p
      key={(ok ?? "") + (error ?? "")}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease }}
      className={`flex min-w-0 items-start gap-2 text-[13px] leading-snug ${error ? "text-red-200" : "text-emerald-200"}`}
    >
      <span className={`mt-[5px] size-1.5 shrink-0 rounded-full ${error ? "bg-red-400" : "bg-emerald-400"}`} />
      <span className="min-w-0">{error ?? ok}</span>
    </motion.p>
  );
}
