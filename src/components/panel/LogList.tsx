"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { LogRow } from "@/lib/logs";
import { Btn, Card, ease, Empty, field, Icon, ICONS } from "./kit";

type Filters = { typ: string; poziom: string; q: string; przed: string };

const LEVEL = {
  info: { label: "Info", dot: "bg-sky-400", text: "text-sky-200" },
  success: { label: "Sukces", dot: "bg-emerald-400", text: "text-emerald-200" },
  warn: { label: "Ostrzeżenie", dot: "bg-amber-300", text: "text-amber-200" },
  error: { label: "Błąd", dot: "bg-red-400", text: "text-red-200" },
} as const;

const dayKey = (ms: number) => new Date(ms).toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
const dayLabel = (ms: number) => {
  const k = dayKey(ms);
  if (k === dayKey(Date.now())) return "Dziś";
  if (k === dayKey(Date.now() - 86_400_000)) return "Wczoraj";
  return new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Warsaw" }).format(ms);
};
const time = (ms: number) => new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Warsaw" }).format(ms);

function Item({ r, kinds }: { r: LogRow; kinds: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const lv = LEVEL[r.level] ?? LEVEL.info;
  const meta = r.meta ? (JSON.parse(r.meta) as Record<string, unknown>) : null;
  const expandable = !!(meta || r.ip || r.actor);
  return (
    <li className="relative pl-7">
      <span className={`absolute top-[7px] left-[3px] size-[9px] rounded-full ${lv.dot} ring-4 ring-surface`} />
      <button type="button" disabled={!expandable} onClick={() => setOpen((o) => !o)} className="group w-full rounded-xl px-3 py-2.5 text-left transition-colors enabled:hover:bg-white/[0.03]">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
          <span className="w-[62px] shrink-0 pt-px font-mono text-[12px] text-dim tabular-nums">{time(r.ts)}</span>
          <span className="min-w-0 flex-1 text-[14px] leading-snug break-words">{r.message}</span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="rounded-full border border-line-2 px-2 py-0.5 text-[11.5px] text-muted">{kinds[r.kind] ?? r.kind}</span>
            {expandable && <Icon d={ICONS.arrowDown} className={`size-3.5 text-dim transition-transform duration-300 ${open ? "rotate-180" : ""}`} />}
          </span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
            <dl className="mx-3 mb-2 grid gap-x-6 gap-y-1.5 rounded-xl bg-black/25 p-3.5 font-mono text-[12px] sm:ml-[90px] sm:grid-cols-[auto_1fr]">
              <dt className="text-dim">poziom</dt>
              <dd className={lv.text}>{lv.label}</dd>
              {r.actor && (
                <>
                  <dt className="text-dim">kto</dt>
                  <dd className="break-all">{r.actor}</dd>
                </>
              )}
              {r.ip && (
                <>
                  <dt className="text-dim">ip</dt>
                  <dd>{r.ip}</dd>
                </>
              )}
              {meta &&
                Object.entries(meta).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-dim">{k}</dt>
                    <dd className="break-all text-muted">{typeof v === "string" ? v : JSON.stringify(v)}</dd>
                  </div>
                ))}
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function LogList({ rows, more, kinds, stats, filters }: { rows: LogRow[]; more: boolean; kinds: Record<string, string>; stats: { total: number; errors: number; warns: number; logins: number }; filters: Filters }) {
  const router = useRouter();
  const path = usePathname();
  const [q, setQ] = useState(filters.q);
  const [pending, start] = useTransition();
  const href = (p: Partial<Filters>) => {
    const next = { ...filters, przed: "", ...p };
    const s = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
    return s ? `${path}?${s}` : path;
  };

  const groups: { key: string; label: string; items: LogRow[] }[] = [];
  for (const r of rows) {
    const k = dayKey(r.ts);
    const g = groups.at(-1);
    if (g?.key === k) g.items.push(r);
    else groups.push({ key: k, label: dayLabel(r.ts), items: [r] });
  }

  const tiles = [
    { label: "Zdarzenia (24 h)", value: stats.total, tone: "text-ink" },
    { label: "Błędy", value: stats.errors, tone: stats.errors ? "text-red-300" : "text-ink", f: { poziom: "error" } },
    { label: "Ostrzeżenia", value: stats.warns, tone: stats.warns ? "text-amber-200" : "text-ink", f: { poziom: "warn" } },
    { label: "Logowania", value: stats.logins, tone: "text-ink", f: { typ: "auth" } },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <motion.div key={t.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.7, ease }}>
            <Link href={t.f ? href(t.f) : path} className="edge block rounded-[20px] bg-surface/80 p-4 transition-colors hover:bg-surface sm:p-5">
              <p className="text-[12.5px] text-dim">{t.label}</p>
              <p className={`mt-2 text-[28px] tracking-[-0.02em] tabular-nums ${t.tone}`}>{t.value}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      <Card delay={0.1}>
        <div className="mb-5 flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" data-lenis-prevent>
            {[["", "Wszystko"], ...Object.entries(kinds)].map(([k, l]) => (
              <Link key={k} href={href({ typ: k })} scroll={false} className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] transition-colors ${filters.typ === k ? "bg-white/[0.08] text-ink" : "text-muted hover:text-ink"}`}>
                {l}
              </Link>
            ))}
          </div>
          <form
            className="flex flex-wrap gap-2 sm:flex-nowrap"
            onSubmit={(e) => {
              e.preventDefault();
              start(() => router.push(href({ q })));
            }}
          >
            <div className="relative min-w-0 basis-full sm:basis-auto sm:flex-1 lg:w-64">
              <Icon d={ICONS.search} className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-dim" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj…" className={`${field} h-10 pl-9`} />
            </div>
            <select value={filters.poziom} onChange={(e) => start(() => router.push(href({ poziom: e.target.value })))} className={`${field} h-10 min-w-0 flex-1 bg-surface sm:w-auto sm:flex-none`} aria-label="Poziom">
              <option value="">Każdy poziom</option>
              {Object.entries(LEVEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
            <Btn type="button" size="sm" variant="ghost" icon={ICONS.refresh} className="!h-10" onClick={() => start(() => router.refresh())} aria-label="Odśwież">
              <span className="sr-only">Odśwież</span>
            </Btn>
          </form>
        </div>

        <div className={`transition-opacity ${pending ? "opacity-50" : ""}`}>
          {groups.length ? (
            <div className="space-y-6">
              {groups.map((g) => (
                <section key={g.key}>
                  <h3 className="mb-2 pl-1 text-[12.5px] text-dim first-letter:uppercase">{g.label}</h3>
                  <ul className="relative space-y-0.5 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-px before:bg-line">
                    {g.items.map((r) => (
                      <Item key={r.id} r={r} kinds={kinds} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <Empty icon={ICONS.logs} title="Brak wpisów" text={filters.q || filters.typ || filters.poziom ? "Nic nie pasuje do filtrów." : "Tutaj pojawią się logowania, płatności, zmiany ustawień i błędy wysyłki."} />
          )}
          {more && (
            <div className="mt-6 flex justify-center">
              <Link href={href({ ...filters, przed: String(rows.at(-1)!.ts) })} className="rounded-full border border-line-2 px-5 py-2.5 text-[13.5px] text-muted transition-colors hover:text-ink">
                Starsze wpisy
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
