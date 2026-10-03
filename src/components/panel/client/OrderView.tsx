"use client";

import { motion } from "motion/react";
import { Count, ease, Icon } from "../kit";

/* Zlecenie oczami klienta: duża karta z odliczaniem i postępem oraz oś etapów */

export function OrderHero({ title, service, status, statusLabel, left, progress, start, due, since, done }: { title: string; service: string | null; status: string; statusLabel: string; left: number; progress: number; start: string; due: string; since: string; done: boolean }) {
  const late = !done && left < 0;
  const tone = done ? "text-emerald-300" : late ? "text-red-300" : "text-accent-2";
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }} className="relative overflow-hidden rounded-[28px] bg-surface p-6 ring-1 ring-white/[0.05] ring-inset sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute -top-48 -left-40 size-[560px] rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.3),transparent)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.06)_1px,transparent_1.2px)] [mask-image:radial-gradient(60%_90%_at_100%_0%,black,transparent)] bg-[size:8px_8px]" aria-hidden />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {service && <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[12.5px] text-muted">{service}</span>}
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] ${done ? "bg-emerald-400/10 text-emerald-200" : status === "planned" ? "bg-sky-400/10 text-sky-200" : "bg-accent/15 text-accent-2"}`}>
              <span className="relative flex size-1.5">
                {!done && <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-70" />}
                <span className="relative size-1.5 rounded-full bg-current" />
              </span>
              {statusLabel}
            </span>
          </div>
          <h1 className="mt-5 text-[clamp(2.1rem,4.6vw,3.6rem)] leading-[1.02] font-medium tracking-[-0.035em]">{title}</h1>
          <p className="mt-3 text-[14.5px] text-muted">Zlecenie przyjęte {since}</p>
        </div>

        <div className="shrink-0 lg:text-right">
          {done ? (
            <>
              <p className="text-[13px] text-dim">Oddane</p>
              <p className="mt-1 flex items-center gap-2 text-[44px] leading-none font-medium tracking-[-0.04em] text-emerald-300 lg:justify-end">
                <Icon d="M5 12.5l4.5 4.5L19 7.5" className="size-10" /> Gotowe
              </p>
            </>
          ) : (
            <>
              <p className="text-[13px] text-dim">{late ? "Po terminie" : left === 0 ? "Termin" : "Do oddania"}</p>
              <p className={`mt-1 text-[72px] leading-[0.9] font-medium tracking-[-0.05em] sm:text-[88px] ${tone}`}>
                {left === 0 ? "dziś" : <Count value={Math.abs(left)} />}
                {left !== 0 && <span className="ml-2 text-[22px] tracking-normal text-muted">{Math.abs(left) === 1 ? "dzień" : "dni"}</span>}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="relative mt-8">
        <div className="relative h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full ${done ? "bg-emerald-400" : late ? "bg-red-400" : "bg-gradient-to-r from-accent via-[#a48cff] to-accent-2"}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(3, Math.round(progress * 100))}%` }}
            transition={{ delay: 0.3, duration: 1.4, ease }}
          />
          {!done && <motion.div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/30 to-transparent" initial={{ left: "-10%" }} animate={{ left: "110%" }} transition={{ delay: 1.6, duration: 2.2, repeat: Infinity, repeatDelay: 2.5 }} />}
        </div>
        <div className="mt-3 flex justify-between text-[13px] text-dim">
          <span>Start · {start}</span>
          <span className="text-muted tabular-nums">{Math.round(progress * 100)}%</span>
          <span>Termin · {due}</span>
        </div>
      </div>
    </motion.section>
  );
}

export function Stepper({ steps }: { steps: { label: string; sub: string; state: "done" | "now" | "next" }[] }) {
  return (
    <motion.ol initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6, ease }} className="mt-4 grid grid-cols-2 gap-3 rounded-[22px] bg-surface p-5 ring-1 ring-white/[0.04] ring-inset sm:grid-cols-4 sm:gap-0 sm:p-6">
      {steps.map((s, i) => (
        <li key={s.label} className="relative sm:pr-4">
          {i < steps.length - 1 && <span className={`absolute top-[15px] left-9 hidden h-px w-[calc(100%-44px)] sm:block ${s.state === "done" ? "bg-accent/60" : "bg-white/[0.08]"}`} />}
          <span className={`relative grid size-8 place-items-center rounded-full text-[12px] ${s.state === "done" ? "bg-accent text-white" : s.state === "now" ? "bg-accent/15 text-accent-2 ring-1 ring-accent/60" : "bg-white/[0.05] text-dim"}`}>
            {s.state === "now" && <span className="absolute inset-0 animate-ping rounded-full ring-1 ring-accent/50" />}
            {s.state === "done" ? <Icon d="M5 12.5l4.5 4.5L19 7.5" className="size-4" /> : i + 1}
          </span>
          <p className={`mt-3 text-[14.5px] ${s.state === "next" ? "text-muted" : ""}`}>{s.label}</p>
          <p className="mt-0.5 text-[12.5px] text-dim">{s.sub}</p>
        </li>
      ))}
    </motion.ol>
  );
}
