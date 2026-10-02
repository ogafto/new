"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Card, CardHead, Count, ease, Icon, ICONS } from "./kit";

/* Nagłówek kokpitu: powitanie na tle „zorzy”, liczby dnia i szybkie akcje */

type S = { label: string; value: number; suffix?: string; href?: string; live?: boolean };

export default function CockpitHero({ greeting, date, stats, soon, children }: { greeting: string; date: string; stats: S[]; soon?: boolean; children?: React.ReactNode }) {
  return (
    <motion.section
      className="edge relative mb-4 overflow-hidden rounded-[28px] bg-surface/70 p-6 sm:p-8 lg:mb-5 lg:p-10"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease }}
    >
      {/* zorza */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-1/2 -left-1/4 size-[140%] animate-[aurora_18s_ease-in-out_infinite] bg-[radial-gradient(35%_45%_at_30%_40%,rgb(139_108_255/0.28),transparent_70%),radial-gradient(30%_40%_at_75%_30%,rgb(180_162_255/0.16),transparent_70%),radial-gradient(40%_40%_at_60%_80%,rgb(52_211_153/0.07),transparent_70%)] blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(70%_80%_at_70%_20%,black,transparent)]" />
      </div>

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <motion.div className="flex flex-wrap items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }}>
            <p className="text-[13px] text-dim first-letter:uppercase">{date}</p>
            <Link
              href="/panel/admin/tresci#soon"
              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-[12px] transition-colors ${soon ? "border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15" : "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-200 hover:bg-emerald-400/15"}`}
            >
              <span className="relative flex size-1.5">
                <span className={`absolute inset-0 animate-ping rounded-full ${soon ? "bg-amber-300/80" : "bg-emerald-400/80"}`} />
                <span className={`relative size-1.5 rounded-full ${soon ? "bg-amber-300" : "bg-emerald-400"}`} />
              </span>
              {soon ? "Tryb zapowiedzi — strona ukryta" : "Strona online"}
            </Link>
          </motion.div>
          <h1 className="h-display mt-2 overflow-hidden pb-[0.08em] text-[clamp(2.2rem,4.6vw,3.8rem)]">
            <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ delay: 0.1, duration: 1, ease }}>
              {greeting}
            </motion.span>
          </h1>
        </div>
        {children && (
          <motion.div className="min-w-0" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8, ease }}>
            {children}
          </motion.div>
        )}
      </div>

      <div className="relative mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
        {stats.map((s, i) => {
          const inner = (
            <>
              <span className="flex items-center gap-2 text-[12.5px] text-dim">
                {s.live && (
                  <span className="relative flex size-1.5">
                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/80" />
                    <span className="relative size-1.5 rounded-full bg-emerald-400" />
                  </span>
                )}
                {s.label}
              </span>
              <span className="mt-1.5 flex items-end justify-between gap-2">
                <Count value={s.value} suffix={s.suffix} className="h-display text-[28px] leading-none sm:text-[34px]" />
                {s.href && <Icon d={ICONS.arrowUp} className="size-4 rotate-45 text-dim opacity-0 transition-opacity group-hover:opacity-100" />}
              </span>
            </>
          );
          const cls = "group block bg-bg/60 p-4 backdrop-blur-sm transition-colors sm:p-5";
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.06, duration: 0.7, ease }}>
              {s.href ? (
                <Link href={s.href} className={`${cls} hover:bg-bg/30`}>
                  {inner}
                </Link>
              ) : (
                <div className={cls}>{inner}</div>
              )}
            </motion.div>
          );
        })}
      </div>
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
