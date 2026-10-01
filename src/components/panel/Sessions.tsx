"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { journey } from "@/app/panel/admin/analityka/actions";
import type { SessionRow } from "@/lib/analytics";
import { ease, Empty, ICONS, Icon, Modal } from "./kit";

type Step = Awaited<ReturnType<typeof journey>>[number];
const time = (ms: number) => new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(ms);
const dt = (ms: number) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(ms);
const dur = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`);
const EV: Record<string, string> = { click: "Kliknięcie", section: "Zobaczył sekcję", form: "Formularz", custom: "Zdarzenie" };

export default function Sessions({ rows }: { rows: SessionRow[] }) {
  const [open, setOpen] = useState<SessionRow | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [pending, start] = useTransition();

  if (!rows.length) return <Empty icon={ICONS.chart} title="Jeszcze nikt nie odwiedził strony" text="Dane pojawią się po pierwszych wizytach (Twoje wejścia jako admina nie są liczone)." />;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-[13.5px]">
          <thead className="text-left text-[12px] text-dim">
            <tr>
              <th className="pb-3 font-normal">Kiedy</th>
              <th className="pb-3 font-normal">Wejście</th>
              <th className="pb-3 font-normal">Źródło</th>
              <th className="pb-3 font-normal">Urządzenie</th>
              <th className="pb-3 text-right font-normal">Strony</th>
              <th className="pb-3 text-right font-normal">Czas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr
                key={r.session}
                className="cursor-pointer transition-colors hover:bg-white/[0.02]"
                onClick={() => {
                  setOpen(r);
                  setSteps([]);
                  start(async () => setSteps(await journey(r.session)));
                }}
              >
                <td className="py-3 pr-3 whitespace-nowrap text-muted">{dt(r.start)}</td>
                <td className="max-w-[200px] truncate py-3 pr-3">{r.entry}</td>
                <td className="py-3 pr-3 text-muted">{r.source}</td>
                <td className="py-3 pr-3 text-muted">
                  {r.device} · {r.browser}
                  {r.country ? ` · ${r.country}` : ""}
                </td>
                <td className="py-3 text-right tabular-nums">{r.pages}</td>
                <td className="py-3 text-right text-muted tabular-nums">{dur(r.time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} title="Ścieżka wizyty" wide>
        {open && (
          <p className="-mt-3 mb-6 text-[13px] text-dim">
            {dt(open.start)} · {open.device}, {open.browser} · {open.source} · {dur(open.time)}
          </p>
        )}
        {pending ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />
            ))}
          </div>
        ) : (
          <ol className="relative ml-3 border-l border-line">
            {steps.map((s, i) => (
              <motion.li key={i} className="relative pb-5 pl-6 last:pb-0" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03, duration: 0.5, ease }}>
                <span className={`absolute top-1 -left-[7px] grid size-3.5 place-items-center rounded-full border-2 border-surface ${s.kind === "page" ? "bg-accent" : s.type === "click" ? "bg-sky-400" : "bg-white/40"}`} />
                {s.kind === "page" ? (
                  <div>
                    <p className="text-[14.5px]">
                      Otworzył <span className="text-accent-2">{s.path}</span>
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-dim">
                      {time(s.ts)} · {dur(Math.round(s.duration / 1000))} na stronie · przewinął {s.scroll}%
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="flex items-center gap-2 text-[14px] text-muted">
                      <Icon d={s.type === "click" ? ICONS.target : ICONS.eye} className="size-3.5" />
                      {EV[s.type] ?? s.type}: <span className="text-ink">{s.label || "—"}</span>
                    </p>
                    <p className="mt-0.5 text-[12px] text-dim">
                      {time(s.ts)}
                      {s.value ? ` · ${s.value}` : ""}
                    </p>
                  </div>
                )}
              </motion.li>
            ))}
          </ol>
        )}
      </Modal>
    </>
  );
}
