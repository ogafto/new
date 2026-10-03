"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Card, CardHead, Count, ease, Icon, ICONS } from "./kit";

/* Nagłówek kokpitu: powitanie na tle „zorzy”, liczby dnia i szybkie akcje */

type S = { label: string; value: number; suffix?: string; href?: string; live?: boolean };

// „Kula na żywo”: liczba osób na stronie w obracającym się, świecącym pierścieniu
function LiveOrb({ value }: { value: number }) {
  return (
    <Link href="/panel/admin/analityka" className="group relative grid size-[176px] shrink-0 place-items-center sm:size-[200px]" aria-label={`${value} osób na stronie teraz`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute inset-[18%] rounded-full border border-accent/40"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.9, opacity: 0 }}
          transition={{ duration: 3.6, delay: i * 1.2, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
      <span className="absolute inset-[10%] rounded-full bg-[conic-gradient(from_0deg,rgb(139_108_255/0),rgb(139_108_255/0.9),rgb(180_162_255/0.2),rgb(52_211_153/0.6),rgb(139_108_255/0))] [animation:orb-spin_6s_linear_infinite] [mask:radial-gradient(farthest-side,transparent_calc(100%-2px),black_calc(100%-1px))]" />
      <span className="absolute inset-[14%] rounded-full bg-[radial-gradient(circle_at_35%_30%,rgb(180_162_255/0.35),rgb(40_30_90/0.55)_45%,rgb(10_10_16/0.9)_75%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.15),0_20px_60px_-10px_rgb(139_108_255/0.55)] transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]" />
      <span className="relative flex flex-col items-center">
        <Count value={value} className="h-display text-[52px] leading-none sm:text-[60px]" />
        <span className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-muted">
          <span className="relative flex size-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/80" />
            <span className="relative size-1.5 rounded-full bg-emerald-400" />
          </span>
          na stronie teraz
        </span>
      </span>
    </Link>
  );
}

export default function CockpitHero({ greeting, name, date, stats, soon, live, children }: { greeting: string; name?: string; date: string; stats: S[]; soon?: boolean; live?: number; children?: React.ReactNode }) {
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
          <h1 className="h-display mt-3 overflow-hidden pb-[0.08em] text-[clamp(2.4rem,5vw,4.4rem)] leading-[0.98]">
            <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ delay: 0.1, duration: 1, ease }}>
              {greeting}
              {name && (
                <>
                  <br />
                  <span className="bg-[linear-gradient(90deg,#efedf5,#b4a2ff,#8b6cff,#efedf5)] bg-[length:200%_100%] bg-clip-text text-transparent [animation:text-shine_8s_linear_infinite]">{name}</span>
                </>
              )}
            </motion.span>
          </h1>
        </div>
        {children && (
          <motion.div className="min-w-0" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8, ease }}>
            {children}
          </motion.div>
        )}
        {live !== undefined && (
          <motion.div className="hidden self-center sm:block lg:-my-6 lg:mr-4" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25, duration: 1, ease }}>
            <LiveOrb value={live} />
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
