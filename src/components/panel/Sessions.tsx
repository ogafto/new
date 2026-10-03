"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { journey } from "@/app/panel/admin/analityka/actions";
import type { SessionRow } from "@/lib/analytics";
import { ease, Empty, ICONS, Icon } from "./kit";
import { Drawer, Th } from "./views/ui";
import { deviceIcon } from "./analytics/icons";

type Step = Awaited<ReturnType<typeof journey>>[number];
const time = (ms: number) => new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(ms);
const dt = (ms: number) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(ms);
const dur = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`);
const short = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : `${s} s`);
const flag = (cc: string | null) => (cc && /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0))) : "🌐");
const EV: Record<string, string> = { click: "Kliknięcie", section: "Sekcja", form: "Formularz", custom: "Zdarzenie" };
const FORM: Record<string, string> = { start: "zaczął wypełniać", submit: "wysłał" };

export default function Sessions({ rows }: { rows: SessionRow[] }) {
  const [open, setOpen] = useState<SessionRow | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [pending, start] = useTransition();
  const [limit, setLimit] = useState(12);

  if (!rows.length) return <Empty icon={ICONS.chart} title="Brak wizyt w tym okresie" />;

  const show = (r: SessionRow) => {
    setOpen(r);
    setSteps([]);
    start(async () => setSteps(await journey(r.session)));
  };
  const shown = rows.slice(0, limit);
  const pages = steps.filter((s) => s.kind === "page").length;
  const events = steps.length - pages;

  return (
    <>
      <table className="hidden w-full table-fixed text-[13.5px] md:table">
        <thead className="bg-white/[0.015]">
          <tr className="border-y border-white/[0.06]">
            <Th className="w-[140px]">Kiedy</Th>
            <Th>Wejście</Th>
            <Th className="w-[150px]">Źródło</Th>
            <Th className="hidden w-[200px] lg:table-cell">Urządzenie</Th>
            <Th right className="w-[80px]">
              Strony
            </Th>
            <Th right className="w-[96px]">
              Czas
            </Th>
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <tr key={r.session} onClick={() => show(r)} className="group h-[52px] cursor-pointer border-b border-white/[0.045] transition-colors last:border-0 hover:bg-white/[0.025]">
              <td className="pr-3 pl-5 whitespace-nowrap text-muted tabular-nums">{dt(r.start)}</td>
              <td className="truncate px-3 font-mono text-[12.5px]">{r.entry}</td>
              <td className="truncate px-3 text-muted">{r.source}</td>
              <td className="hidden px-3 text-muted lg:table-cell">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="text-[14px] leading-none">{flag(r.country)}</span>
                  <Icon d={deviceIcon(r.device)} className="size-3.5 shrink-0 text-dim" />
                  <span className="truncate">{r.browser}</span>
                </span>
              </td>
              <td className="px-3 text-right tabular-nums">
                <span className={`inline-flex min-w-7 justify-center rounded-full px-2 py-0.5 text-[12px] ${r.pages > 2 ? "bg-accent/15 text-accent-2" : "bg-white/[0.05] text-muted"}`}>{r.pages}</span>
              </td>
              <td className="pr-5 pl-3 text-right text-muted tabular-nums">
                <span className="inline-flex items-center gap-2">
                  {short(r.time)}
                  <Icon d={ICONS.arrowUp} className="size-3.5 rotate-90 text-dim opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-white/[0.05] border-t border-white/[0.06] md:hidden">
        {shown.map((r) => (
          <li key={r.session}>
            <button type="button" onClick={() => show(r)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-white/[0.03]">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-[15px]">{flag(r.country)}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-mono text-[12.5px]">{r.entry}</span>
                  <span className="shrink-0 text-[12px] text-dim tabular-nums">{dt(r.start)}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-dim">
                  <Icon d={deviceIcon(r.device)} className="size-3 shrink-0" />
                  {r.source} · {r.pages} {r.pages === 1 ? "strona" : "str."} · {short(r.time)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {rows.length > limit && (
        <div className="border-t border-white/[0.06] px-5 py-3.5">
          <button type="button" onClick={() => setLimit((l) => l + 18)} className="rounded-full border border-white/[0.1] px-3.5 py-1.5 text-[12.5px] text-muted transition-colors hover:border-white/25 hover:text-ink">
            Pokaż więcej · {rows.length - limit}
          </button>
        </div>
      )}

      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        title="Ścieżka wizyty"
        sub={open && <span className="first-letter:uppercase">{dt(open.start)}</span>}
      >
        {open && (
          <>
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] text-center">
              {[
                ["Czas", dur(open.time)],
                ["Strony", String(open.pages)],
                ["Zdarzenia", pending ? "…" : String(events)],
              ].map(([k, v]) => (
                <div key={k} className="bg-[rgb(17_17_23)] px-2 py-3">
                  <p className="text-[11.5px] text-dim">{k}</p>
                  <p className="mt-1 text-[16px] tabular-nums">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[12px]">
              {[
                [flag(open.country), open.country ?? "—"],
                ["", open.source],
                ["", `${open.device} · ${open.browser}`],
              ].map(([f, v]) => (
                <span key={v} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] px-2.5 py-1 text-muted">
                  {f && <span className="text-[13px] leading-none">{f}</span>}
                  {v}
                </span>
              ))}
            </div>

            <p className="mt-6 mb-3 text-[12.5px] text-dim">Oś czasu</p>
            {pending ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />
                ))}
              </div>
            ) : (
              <ol className="relative ml-1.5 border-l border-white/[0.08]">
                {steps.map((s, i) => (
                  <motion.li key={i} className="relative pb-4 pl-5 last:pb-0" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 20) * 0.025, duration: 0.35, ease }}>
                    <span
                      className={`absolute -left-[5px] ring-4 ring-[rgb(16_16_22)] ${s.kind === "page" ? "top-1.5 size-[9px] rounded-full bg-accent shadow-[0_0_10px_rgb(139_108_255/0.8)]" : s.type === "click" ? "top-2 size-[9px] rounded-full bg-sky-400" : s.type === "form" ? "top-2 size-[9px] rounded-full bg-emerald-400" : "top-2 size-[9px] rounded-full bg-white/30"}`}
                    />
                    {s.kind === "page" ? (
                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
                        <p className="flex items-baseline justify-between gap-3">
                          <span className="truncate font-mono text-[13px] text-accent-2">{s.path}</span>
                          <span className="shrink-0 text-[11.5px] text-dim tabular-nums">{time(s.ts)}</span>
                        </p>
                        <p className="mt-1.5 flex items-center gap-3 text-[12px] text-dim">
                          <span>{dur(Math.round(s.duration / 1000))}</span>
                          <span className="flex flex-1 items-center gap-2">
                            <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                              <span className="block h-full rounded-full bg-accent-2/70" style={{ width: `${s.scroll}%` }} />
                            </span>
                            <span className="tabular-nums">{s.scroll}%</span>
                          </span>
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-between gap-3 px-1 py-0.5">
                        <p className="min-w-0 text-[13px] text-muted">
                          <span className="text-dim">{EV[s.type] ?? s.type}:</span> <span className="text-ink">{s.type === "form" ? (FORM[s.label ?? ""] ?? s.label) : s.label || "—"}</span>
                          {s.value && <span className="block truncate font-mono text-[11.5px] text-dim">{s.value}</span>}
                        </p>
                        <span className="shrink-0 text-[11.5px] text-dim tabular-nums">{time(s.ts)}</span>
                      </div>
                    )}
                  </motion.li>
                ))}
              </ol>
            )}
          </>
        )}
      </Drawer>
    </>
  );
}
