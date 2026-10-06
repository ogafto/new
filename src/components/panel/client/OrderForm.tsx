"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { submitOrderRequest } from "@/app/panel/actions";
import { Card, ease, field, Icon, ICONS } from "../kit";
import { iconOf, iconPath } from "@/lib/service-icons";
import { content } from "@/lib/content";

type Service = { id: string; name: string; price: number; time: string; description: string; icon?: string };


function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`relative rounded-full border px-4 py-2 text-[13.5px] transition-colors ${on ? "border-accent/50 text-ink" : "border-line-2 text-muted hover:border-white/30 hover:text-ink"}`}>
      {on && <motion.span className="absolute inset-0 rounded-full bg-accent/15" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />}
      <span className="relative">{children}</span>
    </button>
  );
}

export default function OrderForm({ services }: { services: Service[] }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const all = [...services.map((s) => s.name), "Coś innego"];
  // budżety i terminy z CMS (te same co w formularzu na stronie)
  const BUDGETS = content().forms.budgets.map((b) => b.v);
  const TIMES = content().forms.timelines;
  const toggle = (n: string) => setPicked((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));

  if (done)
    return (
      <Card>
        <div className="flex flex-col items-center py-12 text-center">
          <div className="relative grid size-24 place-items-center">
            <motion.span className="absolute inset-0 rounded-full bg-accent/30 blur-2xl" initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }} transition={{ duration: 1 }} />
            <svg viewBox="0 0 64 64" className="relative size-20" fill="none" aria-hidden>
              <motion.circle cx="32" cy="32" r="30" stroke="#8b6cff" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
              <motion.path d="M20 33l8 8 16-17" stroke="#b4a2ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.45, duration: 0.5 }} />
            </svg>
          </div>
          <h2 className="h-display mt-6 text-[clamp(2rem,4vw,3rem)]">Zamówienie wysłane.</h2>
          <p className="mt-3 max-w-md text-[15.5px] text-muted">Odezwę się z pytaniami i wyceną. Status zobaczysz w zakładce „Moje zamówienia”.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            <Link href="/panel/zamowienia" className="group btn btn-primary !h-12 text-[14.5px]">
              <span className="roll">
                <span>Moje zamówienia</span>
                <span aria-hidden>Moje zamówienia</span>
              </span>
              <span className="dot !size-9">
                <Icon d={ICONS.arrowUp} className="size-4 rotate-45" />
              </span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setDone(false);
                setPicked([]);
                setDescription("");
                setBudget("");
                setTimeline("");
              }}
              className="btn btn-outline !h-12 text-[14.5px]"
            >
              Zamów coś jeszcze
            </button>
          </div>
        </div>
      </Card>
    );

  return (
    <form
      className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError("");
          const r = await submitOrderRequest({ services: picked, description, budget, timeline });
          if (r.error) setError(r.error);
          else setDone(true);
        });
      }}
    >
      <div className="space-y-4 lg:space-y-5">
        <Card>
          <p className="mb-4 flex items-center gap-2 text-[15px]">
            <span className="grid size-6 place-items-center rounded-full bg-accent/20 text-[12px] text-accent-2">1</span> Co tworzymy?
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {services.map((s, i) => {
              const on = picked.includes(s.name);
              return (
                <motion.button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.name)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.5, ease }}
                  className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-colors ${on ? "border-accent/60 bg-accent/[0.08]" : "border-line-2 hover:border-white/25 hover:bg-white/[0.02]"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`grid size-10 place-items-center rounded-xl transition-colors ${on ? "bg-accent text-white" : "bg-white/[0.05] text-muted group-hover:text-accent-2"}`}>
                      <Icon d={iconPath(iconOf(s))} />
                    </span>
                    <span className={`grid size-6 place-items-center rounded-full border transition-colors ${on ? "border-accent bg-accent text-white" : "border-line-2"}`}>{on && <Icon d={ICONS.check} className="size-3.5" />}</span>
                  </div>
                  <p className="mt-4 text-[15.5px]">{s.name}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-dim">{s.description}</p>
                  <p className="mt-3 text-[13px] text-muted">
                    {s.price ? (
                      <>
                        od <span className="text-ink tabular-nums">{s.price} zł</span>
                      </>
                    ) : (
                      "wycena indywidualna"
                    )}
                    {s.time ? ` · ${s.time}` : ""}
                  </p>
                </motion.button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {all.slice(services.length).map((n) => (
              <Chip key={n} on={picked.includes(n)} onClick={() => toggle(n)}>
                {n}
              </Chip>
            ))}
          </div>
        </Card>

        <Card delay={0.05}>
          <p className="mb-4 flex items-center gap-2 text-[15px]">
            <span className="grid size-6 place-items-center rounded-full bg-accent/20 text-[12px] text-accent-2">2</span> Opisz pomysł
          </p>
          <textarea rows={6} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Np. strona dla mojej kawiarni z menu, galerią i rezerwacją stolików. Podoba mi się styl…" className={`${field} resize-none py-3.5 text-[15px] leading-relaxed`} />
        </Card>
      </div>

      <div className="space-y-4 lg:sticky lg:top-24 lg:space-y-5 lg:self-start">
        <Card delay={0.08}>
          <p className="mb-3 flex items-center gap-2 text-[15px]">
            <span className="grid size-6 place-items-center rounded-full bg-accent/20 text-[12px] text-accent-2">3</span> Budżet
          </p>
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map((b) => (
              <Chip key={b} on={budget === b} onClick={() => setBudget(budget === b ? "" : b)}>
                {b}
              </Chip>
            ))}
          </div>
          <p className="mt-6 mb-3 flex items-center gap-2 text-[15px]">
            <span className="grid size-6 place-items-center rounded-full bg-accent/20 text-[12px] text-accent-2">4</span> Termin
          </p>
          <div className="flex flex-wrap gap-2">
            {TIMES.map((t) => (
              <Chip key={t} on={timeline === t} onClick={() => setTimeline(timeline === t ? "" : t)}>
                {t}
              </Chip>
            ))}
          </div>
        </Card>

        <Card delay={0.12} glow>
          <p className="text-[13px] text-dim">Podsumowanie</p>
          <p className="mt-2 text-[16px] leading-snug">{picked.length ? picked.join(" · ") : "Wybierz usługę"}</p>
          <p className="mt-1 text-[13px] text-muted">{[budget, timeline].filter(Boolean).join(" · ") || "Budżet i termin — opcjonalnie"}</p>
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden text-[13.5px] text-red-300">
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <button type="submit" disabled={pending} className="group btn btn-primary mt-5 !h-12 w-full justify-between text-[15px] disabled:opacity-60">
            <span className="roll">
              <span>{pending ? "Wysyłanie…" : "Wyślij zamówienie"}</span>
              <span aria-hidden>{pending ? "Wysyłanie…" : "Wyślij zamówienie"}</span>
            </span>
            <span className="dot !size-9">
              <Icon d={ICONS.arrowUp} className="size-4 rotate-45" />
            </span>
          </button>
        </Card>
      </div>
    </form>
  );
}
