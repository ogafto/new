"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useInView } from "motion/react";
import { Card, CardHead, Count, ease, Icon, ICONS } from "./kit";

/* Nagłówek kokpitu: powitanie na tle „zorzy”, liczby dnia i szybkie akcje */

type S = { label: string; value: number; suffix?: string; href?: string; live?: boolean };

const LogoScene = dynamic(() => import("../hero/LogoScene"), { ssr: false });

function Line({ i, children }: { i: number; children: React.ReactNode }) {
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span className="block origin-[0%_100%]" initial={{ y: "105%", rotate: 4 }} animate={{ y: 0, rotate: 0 }} transition={{ delay: 0.1 + i * 0.09, duration: 1.1, ease }}>
        {children}
      </motion.span>
    </span>
  );
}

/* Kokpit jak hero strony głównej: szklany znak 3D, ogromne powitanie, pas liczb pod linią */
export default function CockpitHero({ greeting, name, accent, date, summary, stats, soon, actions }: { greeting: string; name: string; accent: string; date: string; summary: string; stats: S[]; soon?: boolean; actions?: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const [scene, setScene] = useState(false);
  useEffect(() => {
    // 3D tylko na większych ekranach, po pierwszym malowaniu
    if (window.innerWidth < 1024) return;
    const t = setTimeout(() => setScene(true), 300);
    return () => clearTimeout(t);
  }, []);
  return (
    <section ref={ref} className="relative -mx-4 mb-10 overflow-hidden px-4 sm:-mx-8 sm:px-8 lg:-mx-10 lg:mb-14 lg:px-10">
      {scene && (
        <motion.div
          className="pointer-events-none absolute inset-y-[-15%] right-[-14%] w-[66%] [mask-image:radial-gradient(60%_58%_at_55%_48%,black_35%,transparent_78%)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6 }}
          aria-hidden
        >
          <LogoScene ready active={inView} />
        </motion.div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--color-bg)_30%,transparent_75%),linear-gradient(to_top,var(--color-bg),transparent_40%)]" aria-hidden />

      <div className="relative pt-4 lg:pt-10">
        <motion.div className="flex flex-wrap items-center gap-2.5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
          <p className="kicker first-letter:uppercase">{date}</p>
          <Link
            href="/panel/admin/tresci#soon"
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] ${soon ? "border-amber-300/30 bg-amber-300/10 text-amber-100" : "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-200"}`}
          >
            <span className={`size-1.5 rounded-full ${soon ? "bg-amber-300" : "bg-emerald-400 shadow-[0_0_8px_#34d399]"}`} />
            {soon ? "Tryb zapowiedzi" : "Strona online"}
          </Link>
        </motion.div>

        <h1 className="h-display mt-7 text-[clamp(3rem,8vw,8rem)] leading-[0.92]">
          <Line i={0}>{greeting}</Line>
          <Line i={1}>{name}</Line>
          <Line i={2}>
            <span className="text-accent-2">{accent}</span>
          </Line>
        </h1>

        <div className="mt-10 flex flex-col gap-8 border-t border-line pt-7 lg:flex-row lg:items-end lg:justify-between">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.9, ease }}>
            <p className="max-w-[440px] text-[16.5px] leading-relaxed text-muted">{summary}</p>
            {actions && <div className="mt-6 flex flex-wrap gap-2.5">{actions}</div>}
          </motion.div>
          <motion.dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4 lg:gap-x-10" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.9, ease }}>
            {stats.map((s) => {
              const inner = (
                <>
                  <dt className="flex items-center gap-2 text-[12.5px] text-dim">
                    {s.live && (
                      <span className="relative flex size-1.5">
                        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/80" />
                        <span className="relative size-1.5 rounded-full bg-emerald-400" />
                      </span>
                    )}
                    {s.label}
                  </dt>
                  <dd className="mt-1.5">
                    <Count value={s.value} suffix={s.suffix} className="h-display text-[34px] leading-none sm:text-[40px]" />
                  </dd>
                </>
              );
              return s.href ? (
                <Link key={s.label} href={s.href} className="group block transition-opacity hover:opacity-80">
                  {inner}
                </Link>
              ) : (
                <div key={s.label}>{inner}</div>
              );
            })}
          </motion.dl>
        </div>
      </div>
    </section>
  );
}

const KIND_ICON: Record<string, string> = { auth: ICONS.key, settings: ICONS.gear, payment: ICONS.wallet, inquiry: ICONS.inbox, content: ICONS.doc, client: ICONS.users, mail: ICONS.mail, system: ICONS.logs };
const TONE: Record<string, string> = { success: "text-emerald-300 bg-emerald-400/10", warn: "text-amber-200 bg-amber-300/10", error: "text-red-300 bg-red-400/10", info: "text-muted bg-white/[0.05]" };

function ago(ts: number, now: number) {
  const m = Math.round((now - ts) / 60000);
  if (m < 1) return "teraz";
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h` : `${Math.round(h / 24)} d`;
}

export function Activity({ rows }: { rows: { id: string; ts: number; level: string; kind: string; message: string }[] }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const t0 = setTimeout(tick, 0);
    const t = setInterval(tick, 30000);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
    };
  }, []);
  return (
    <Card delay={0.32}>
      <CardHead title="Aktywność" sub="Co się ostatnio działo">
        <Link href="/panel/admin/logi" className="text-[13px] text-muted transition-colors hover:text-ink">
          Logi →
        </Link>
      </CardHead>
      {rows.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-dim">Cisza — zdarzenia pojawią się tutaj.</p>
      ) : (
        <ul className="relative space-y-1 before:absolute before:top-4 before:bottom-4 before:left-[15px] before:w-px before:bg-line">
          {rows.map((r, i) => (
            <motion.li key={r.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.05, duration: 0.6, ease }} className="relative flex items-start gap-3 py-1.5">
              <span className={`relative grid size-8 shrink-0 place-items-center rounded-lg ring-4 ring-surface ${TONE[r.level] ?? TONE.info}`}>
                <Icon d={KIND_ICON[r.kind] ?? ICONS.logs} className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1 pt-1.5 text-[13px] leading-snug">{r.message}</span>
              <span className="shrink-0 pt-1.5 text-[11.5px] text-dim tabular-nums" suppressHydrationWarning>
                {now ? ago(r.ts, now) : ""}
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ---------- Do zrobienia ---------- */

export type TodoItem = { id: string; kind: "inquiry" | "payment" | "deadline"; title: string; sub: string; href: string; action: string; urgent: boolean };

const TODO_ICON = { inquiry: ICONS.inbox, payment: ICONS.wallet, deadline: ICONS.calendar };

export function Todo({ items }: { items: TodoItem[] }) {
  return (
    <Card delay={0.12} glow={items.some((i) => i.urgent)}>
      <CardHead title="Do zrobienia" sub={items.length ? `${items.length} ${items.length === 1 ? "sprawa" : items.length < 5 ? "sprawy" : "spraw"}` : undefined} />
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <motion.span
            className="grid size-14 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20"
            initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.3 }}
          >
            <Icon d={ICONS.check} className="size-6" />
          </motion.span>
          <p className="mt-4 text-[15px]">Wszystko ogarnięte</p>
        </div>
      ) : (
        <ul className="-mx-2 space-y-1">
          {items.slice(0, 7).map((it, i) => (
            <motion.li key={it.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.04, duration: 0.45, ease }}>
              <Link href={it.href} className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.04]">
                <span className={`relative grid size-9 shrink-0 place-items-center rounded-xl ${it.urgent ? "bg-red-400/12 text-red-300" : it.kind === "inquiry" ? "bg-accent/15 text-accent-2" : "bg-white/[0.05] text-muted"}`}>
                  {it.urgent && <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-red-400 ring-2 ring-surface" />}
                  <Icon d={TODO_ICON[it.kind]} className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px]">{it.title}</span>
                  <span className={`block truncate text-[12.5px] ${it.urgent ? "text-red-300/80" : "text-dim"}`}>{it.sub}</span>
                </span>
                <span className="shrink-0 rounded-full border border-line-2 px-3 py-1 text-[12px] text-muted transition-colors group-hover:border-white/30 group-hover:text-ink">{it.action}</span>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </Card>
  );
}
