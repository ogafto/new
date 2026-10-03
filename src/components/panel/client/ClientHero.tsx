"use client";

import { motion } from "motion/react";
import { ease, Icon, ICONS } from "../kit";
import { ProgressRing } from "../ProjectProgress";

/* Powitanie w panelu klienta: zorza, imię, projekt i postęp */

type Stat = { label: string; value: string; icon: string; tone?: "accent" | "amber" | "green"; href?: string };

export default function ClientHero({ kicker, first, project, stage, stats, welcome = false }: { kicker: string; first: string; project: string; stage: number; stats: Stat[]; welcome?: boolean }) {
  return (
    <motion.section className="edge relative mb-4 overflow-hidden rounded-[28px] bg-surface/70 p-6 sm:p-8 lg:mb-5 lg:p-10" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-1/2 -left-1/4 size-[140%] animate-[aurora_18s_ease-in-out_infinite] bg-[radial-gradient(35%_45%_at_30%_40%,rgb(139_108_255/0.26),transparent_70%),radial-gradient(30%_40%_at_78%_30%,rgb(180_162_255/0.15),transparent_70%),radial-gradient(40%_40%_at_60%_85%,rgb(52_211_153/0.06),transparent_70%)] blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(70%_80%_at_75%_20%,black,transparent)]" />
      </div>

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <motion.p
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-[12px] ${welcome ? "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-200" : "border-white/[0.08] bg-white/[0.03] text-muted"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <span className={`size-1.5 rounded-full ${welcome ? "bg-emerald-400" : "bg-accent-2"}`} />
            <span className="first-letter:uppercase">{kicker}</span>
          </motion.p>
          <h1 className="h-display mt-4 overflow-hidden pb-[0.08em] text-[clamp(2.4rem,5vw,4.2rem)] leading-[0.98]">
            <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ delay: 0.05, duration: 0.7, ease }}>
              Cześć,
              <br />
              <span className="bg-[linear-gradient(90deg,#efedf5,#b4a2ff,#8b6cff,#efedf5)] bg-[length:200%_100%] bg-clip-text text-transparent [animation:text-shine_8s_linear_infinite]">{first}.</span>
            </motion.span>
          </h1>
          <motion.p className="mt-4 flex items-center gap-2 text-[14px] text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
            <Icon d={ICONS.layers} className="size-4 text-accent-2" />
            <span className="truncate">{project}</span>
          </motion.p>
        </div>
        <motion.div className="self-center sm:mr-2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.6, ease }}>
          <ProgressRing stage={stage} />
        </motion.div>
      </div>

      <div className={`relative mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line ${stats.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {stats.map((s, i) => {
          const tone = s.tone === "amber" ? "text-amber-200" : s.tone === "green" ? "text-emerald-300" : s.tone === "accent" ? "text-accent-2" : "text-dim";
          const inner = (
            <>
              <span className="flex items-center gap-2 text-[12.5px] text-dim">
                <Icon d={s.icon} className={`size-3.5 ${tone}`} />
                {s.label}
              </span>
              <span className="mt-1.5 block truncate text-[17px] tracking-[-0.01em] sm:text-[19px]">{s.value}</span>
            </>
          );
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.06, duration: 0.45, ease }}>
              {s.href ? (
                <a href={s.href} className="block bg-bg/60 p-4 backdrop-blur-sm transition-colors hover:bg-bg/30 sm:p-5">
                  {inner}
                </a>
              ) : (
                <div className="bg-bg/60 p-4 backdrop-blur-sm sm:p-5">{inner}</div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
