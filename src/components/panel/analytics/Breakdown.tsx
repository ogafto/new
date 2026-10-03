"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Card, ease, Icon, ICONS } from "../kit";
import { Segmented } from "../views/ui";
export { deviceIcon } from "./icons";

/* Zestawienia w stylu Plausible: wiersze z paskiem w tle, udział procentowy, karty z zakładkami */

export type Row = { name: string; n: number; icon?: string; extra?: string; sub?: string };


function Glyph({ g }: { g: string }) {
  // emoji (flaga) albo ścieżka SVG
  if (!g.startsWith("M")) return <span className="w-4 shrink-0 text-center text-[14px] leading-none">{g}</span>;
  return <Icon d={g} className="size-4 shrink-0 text-dim" />;
}

export function BarRows({ rows, head, empty = "Brak danych", limit = 8, share = true }: { rows: Row[]; head: [string, string]; empty?: string; limit?: number; share?: boolean }) {
  const [all, setAll] = useState(false);
  const max = Math.max(1, ...rows.map((r) => r.n));
  const sum = rows.reduce((a, r) => a + r.n, 0) || 1;
  const shown = all ? rows : rows.slice(0, limit);
  if (!rows.length)
    return (
      <div className="grid min-h-[180px] place-items-center text-center">
        <div>
          <span className="mx-auto grid size-10 place-items-center rounded-xl border border-white/[0.08] text-dim">
            <Icon d={ICONS.chart} className="size-4" />
          </span>
          <p className="mt-3 text-[13px] text-dim">{empty}</p>
        </div>
      </div>
    );
  return (
    <div>
      <div className="mb-1.5 flex justify-between px-2.5 text-[11.5px] tracking-wide text-dim uppercase">
        <span>{head[0]}</span>
        <span>{head[1]}</span>
      </div>
      <ul className="space-y-[3px]">
        {shown.map((r, i) => (
          <li key={r.name + i} className="group relative overflow-hidden rounded-[10px]">
            <motion.span
              className="absolute inset-y-0 left-0 rounded-[10px] bg-[linear-gradient(90deg,rgb(139_108_255/0.2),rgb(139_108_255/0.1))] transition-colors group-hover:bg-[linear-gradient(90deg,rgb(139_108_255/0.3),rgb(139_108_255/0.14))]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(1.5, (r.n / max) * 100)}%` }}
              transition={{ delay: 0.08 + i * 0.04, duration: 0.8, ease }}
            />
            <span className="relative flex h-9 items-center justify-between gap-3 px-2.5 text-[13.5px]">
              <span className="flex min-w-0 items-center gap-2.5">
                {r.icon && <Glyph g={r.icon} />}
                <span className="truncate">{r.name}</span>
                {r.extra && <span className="hidden truncate text-[12px] text-dim sm:inline">{r.extra}</span>}
              </span>
              <span className="flex shrink-0 items-center gap-2.5 tabular-nums">
                {share && <span className="w-9 text-right text-[12px] text-dim opacity-0 transition-opacity group-hover:opacity-100">{Math.round((r.n / sum) * 100)}%</span>}
                <span className="min-w-[2.5ch] text-right">{r.n.toLocaleString("pl-PL")}</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
      {rows.length > limit && (
        <button type="button" onClick={() => setAll((a) => !a)} className="mt-3 flex items-center gap-1.5 px-2.5 text-[12.5px] text-dim transition-colors hover:text-ink">
          {all ? "Zwiń" : `Pokaż wszystkie · ${rows.length}`}
          <Icon d={ICONS.arrowDown} className={`size-3 transition-transform ${all ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}

export function TabCard({ id, title, tabs, delay = 0, className = "" }: { id: string; title: string; tabs: { key: string; label: string; rows: Row[]; head: [string, string]; empty?: string; note?: React.ReactNode }[]; delay?: number; className?: string }) {
  const [tab, setTab] = useState(tabs[0].key);
  const cur = tabs.find((t) => t.key === tab) ?? tabs[0];
  return (
    <Card delay={delay} className={className}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 className="text-[15px] font-medium tracking-[-0.01em]">{title}</h2>
        {tabs.length > 1 && <Segmented id={id} value={tab} onChange={setTab} items={tabs.map((t) => ({ value: t.key, label: t.label }))} />}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={cur.key} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2, ease }}>
          {cur.note}
          <BarRows rows={cur.rows} head={cur.head} empty={cur.empty} />
        </motion.div>
      </AnimatePresence>
    </Card>
  );
}

/* Tabela podstron z paskiem udziału i przewinięciem */
export function PagesTable({ rows }: { rows: { path: string; views: number; visitors: number; time: number; scroll: number }[] }) {
  const [all, setAll] = useState(false);
  const max = Math.max(1, ...rows.map((r) => r.views));
  const shown = all ? rows : rows.slice(0, 8);
  if (!rows.length) return <BarRows rows={[]} head={["", ""]} />;
  const cols = "grid grid-cols-[minmax(0,1fr)_64px] items-center gap-x-2 sm:grid-cols-[minmax(0,1fr)_64px_60px] md:grid-cols-[minmax(0,1fr)_64px_60px_56px] lg:grid-cols-[minmax(0,1fr)_64px_60px_56px_112px]";
  return (
    <div>
      <div className={`${cols} mb-1.5 px-2.5 text-[11.5px] tracking-wide text-dim uppercase`}>
        <span>Adres</span>
        <span className="text-right">Odsłony</span>
        <span className="hidden text-right sm:block">Osoby</span>
        <span className="hidden text-right md:block">Czas</span>
        <span className="hidden pl-4 lg:block">Przewinięcie</span>
      </div>
      <ul className="space-y-[3px]">
        {shown.map((p, i) => (
          <li key={p.path} className="group relative overflow-hidden rounded-[10px]">
            <motion.span
              className="absolute inset-y-0 left-0 rounded-[10px] bg-[linear-gradient(90deg,rgb(139_108_255/0.2),rgb(139_108_255/0.1))] transition-colors group-hover:bg-[linear-gradient(90deg,rgb(139_108_255/0.3),rgb(139_108_255/0.14))]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(1.5, (p.views / max) * 100)}%` }}
              transition={{ delay: 0.08 + i * 0.04, duration: 0.8, ease }}
            />
            <div className={`${cols} relative h-9 px-2.5 text-[13.5px]`}>
              <span className="truncate font-mono text-[12.5px]">{p.path}</span>
              <span className="text-right tabular-nums">{p.views.toLocaleString("pl-PL")}</span>
              <span className="hidden text-right text-muted tabular-nums sm:block">{p.visitors.toLocaleString("pl-PL")}</span>
              <span className="hidden text-right text-muted tabular-nums md:block">{p.time >= 60 ? `${Math.floor(p.time / 60)}:${String(p.time % 60).padStart(2, "0")}` : `${p.time} s`}</span>
              <span className="hidden items-center gap-2 pl-4 lg:flex">
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                  <span className="block h-full rounded-full bg-accent-2/80" style={{ width: `${p.scroll}%` }} />
                </span>
                <span className="w-8 text-right text-[12px] text-dim tabular-nums">{p.scroll}%</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
      {rows.length > 8 && (
        <button type="button" onClick={() => setAll((a) => !a)} className="mt-3 flex items-center gap-1.5 px-2.5 text-[12.5px] text-dim transition-colors hover:text-ink">
          {all ? "Zwiń" : `Pokaż wszystkie · ${rows.length}`}
          <Icon d={ICONS.arrowDown} className={`size-3 transition-transform ${all ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}

/* Lejek z krokami-kolumnami i spadkiem między nimi */
export function FunnelBars({ steps }: { steps: { name: string; n: number }[] }) {
  const first = Math.max(1, steps[0]?.n ?? 1);
  return (
    <div>
      <div className="flex h-[150px] items-end gap-2">
        {steps.map((s, i) => {
          const pct = (s.n / first) * 100;
          return (
            <div key={s.name} className="flex h-full flex-1 flex-col justify-end">
              <p className="mb-1.5 text-[18px] leading-none tabular-nums">{s.n.toLocaleString("pl-PL")}</p>
              <div className="relative flex-1">
                <span className="absolute inset-0 rounded-[10px] bg-white/[0.03]" />
                <motion.span
                  className="absolute inset-x-0 bottom-0 rounded-[10px] bg-[linear-gradient(180deg,#b4a2ff,rgb(139_108_255/0.35))] shadow-[inset_0_1px_0_rgb(255_255_255/0.3)]"
                  initial={{ height: 0 }}
                  animate={{ height: `${steps[0]?.n ? Math.max(3, pct) : 0}%` }}
                  transition={{ delay: 0.15 + i * 0.12, duration: 0.9, ease }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2">
        {steps.map((s, i) => (
          <div key={s.name} className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] text-muted">{s.name}</p>
            <p className="text-[12px] text-dim tabular-nums">{i === 0 ? "100%" : `${Math.round((s.n / first) * 100)}%`}</p>
          </div>
        ))}
      </div>
      {steps.length > 1 && steps[0].n > 0 && (
        <p className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[12.5px] text-dim">
          Konwersja <span className="text-ink tabular-nums">{((steps.at(-1)!.n / first) * 100).toLocaleString("pl-PL", { maximumFractionDigits: 1 })}%</span>
          {" · "}największy spadek:{" "}
          <span className="text-muted">
            {(() => {
              let w = 1;
              for (let i = 1; i < steps.length; i++) if (steps[i - 1].n - steps[i].n > steps[w - 1].n - steps[w].n) w = i;
              return `${steps[w - 1].name.toLowerCase()} → ${steps[w].name.toLowerCase()}`;
            })()}
          </span>
        </p>
      )}
    </div>
  );
}
