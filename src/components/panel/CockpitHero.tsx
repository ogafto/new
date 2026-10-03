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

/* Kokpit jak hero strony głównej, w ramce: szklany znak 3D z prawej, ogromne powitanie, pas liczb na dole karty */
export default function CockpitHero({ greeting, name, accent, date, summary, stats, soon, actions, chip, scene3d = true }: { greeting: string; name: string; accent: string; date: string; summary: string; stats: S[]; soon?: boolean; actions?: React.ReactNode; chip?: React.ReactNode; scene3d?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const [at, setAt] = useState<number | null>(null);
  useEffect(() => {
    // 3D tylko na większych ekranach; pozycja znaku liczona z proporcji karty (pole widzenia kamery: 50,9 jednostki w pionie)
    const el = ref.current;
    if (!scene3d || !el || window.innerWidth < 1024) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver(([e]) => {
      const aspect = e.contentRect.width / Math.max(1, e.contentRect.height);
      clearTimeout(t);
      t = setTimeout(() => setAt(Math.max(0, 25.45 * aspect * 0.56)), 200);
    });
    ro.observe(el);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [scene3d]);
  const label = (s: S) => (
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
      <dd className="mt-1.5 flex items-center justify-between gap-2">
        <Count value={s.value} suffix={s.suffix} className="h-display text-[28px] leading-none sm:text-[34px]" />
        {s.href && <Icon d={ICONS.arrowUp} className="size-4 rotate-45 text-dim opacity-0 transition-all duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink group-hover:opacity-100" />}
      </dd>
    </>
  );
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease }}
      className="relative mb-4 overflow-hidden rounded-[30px] border border-white/[0.08] bg-bg shadow-[0_1px_0_0_rgb(255_255_255/0.06)_inset,0_40px_100px_-50px_rgb(139_108_255/0.45)] lg:mb-5 lg:rounded-[36px]"
    >
      {/* tło bez 3D (telefon) — linie i poświata jak na stronie */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.04)_0_1px,transparent_1px_64px)] [mask-image:radial-gradient(70%_80%_at_85%_30%,black,transparent)]" />
        <div className="absolute -top-1/3 -right-1/4 h-[130%] w-[80%] bg-[radial-gradient(closest-side,rgb(139_108_255/0.32),transparent)]" />
      </div>
      {at !== null && (
        <motion.div className="pointer-events-none absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.8 }} aria-hidden>
          <LogoScene ready active={inView} at={at} />
        </motion.div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--color-bg)_15%,rgb(7_7_10/0.55)_42%,transparent_62%)]" aria-hidden />

      <div className="relative px-5 pt-6 pb-7 sm:px-10 sm:pt-9 lg:px-12 lg:pt-11 lg:pb-10">
        <motion.div className="flex flex-wrap items-center gap-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7, ease }}>
          <p className="kicker first-letter:uppercase">{date}</p>
          {chip ?? (
            <Link
              href="/panel/admin/tresci#soon"
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] backdrop-blur ${soon ? "border-amber-300/30 bg-amber-300/10 text-amber-100" : "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-200"}`}
            >
              <span className={`size-1.5 rounded-full ${soon ? "bg-amber-300" : "bg-emerald-400 shadow-[0_0_8px_#34d399]"}`} />
              {soon ? "Tryb zapowiedzi" : "Strona online"}
            </Link>
          )}
        </motion.div>

        <h1 className="h-display mt-6 text-[clamp(2.7rem,6.4vw,6.4rem)] leading-[0.93] sm:mt-8">
          <Line i={0}>{greeting}</Line>
          <Line i={1}>{name}</Line>
          <Line i={2}>
            <span className="bg-gradient-to-r from-accent-2 via-[#d6ccff] to-accent-2 bg-clip-text text-transparent">{accent}</span>
          </Line>
        </h1>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.9, ease }}>
          <p className="mt-6 max-w-[460px] text-[15.5px] leading-relaxed text-muted sm:text-[16.5px]">{summary}</p>
          {actions && <div className="mt-6 flex flex-wrap gap-2.5">{actions}</div>}
        </motion.div>
      </div>

      <motion.dl
        className="relative grid grid-cols-2 border-t border-white/[0.07] bg-[rgb(255_255_255/0.025)] backdrop-blur-md sm:grid-cols-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75, duration: 0.9 }}
      >
        {stats.map((s, i) => {
          const cls = `group block px-5 py-5 transition-colors sm:px-8 lg:px-10 lg:py-6 ${i % 2 ? "border-l border-white/[0.07]" : ""} ${i > 1 ? "border-t border-white/[0.07] sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`;
          return s.href ? (
            <Link key={s.label} href={s.href} className={`${cls} hover:bg-white/[0.03]`}>
              {label(s)}
            </Link>
          ) : (
            <div key={s.label} className={cls}>
              {label(s)}
            </div>
          );
        })}
      </motion.dl>
    </motion.section>
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
    <Card delay={0.32} className="h-full">
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
    <Card delay={0.12} glow={items.some((i) => i.urgent)} className="h-full">
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
