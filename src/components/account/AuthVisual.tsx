"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { steps } from "@/lib/site";
import { Mark, Wordmark } from "../brand/Logo";

const ease = [0.16, 1, 0.3, 1] as const;

// Lewa strona ekranów konta: światło, siatka i podgląd panelu
export default function AuthVisual() {
  return (
    <aside className="relative hidden overflow-hidden border-r border-line bg-surface lg:flex lg:flex-col lg:justify-between lg:p-10">
      <div className="line-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_30%_40%,#000_10%,transparent_70%)]" aria-hidden />
      <div className="absolute -top-40 -left-32 size-[640px] rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.22),transparent)]" aria-hidden />
      <motion.div
        className="absolute top-0 left-[38%] h-full w-px bg-gradient-to-b from-transparent via-accent/50 to-transparent"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 1.6, ease }}
        aria-hidden
      />

      <Link href="/" className="relative flex items-center gap-3" aria-label="afto.works — strona główna">
        <Mark className="size-9" draw />
        <Wordmark className="h-[21px] w-auto" draw />
      </Link>

      <div className="relative">
        <motion.p className="kicker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 1 }}>
          Panel klienta
        </motion.p>
        <h1 className="h-display mt-7 text-[clamp(3rem,4.6vw,4.6rem)]">
          {["Twój projekt.", "Jedno miejsce."].map((l, i) => (
            <span key={l} className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
              <motion.span className={`block ${i ? "text-muted" : ""}`} initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ delay: 0.15 + i * 0.1, duration: 1.2, ease }}>
                {l}
              </motion.span>
            </span>
          ))}
        </h1>

        {/* mini podgląd postępu */}
        <motion.div
          className="edge mt-12 max-w-[440px] rounded-[22px] bg-bg/60 p-5 backdrop-blur"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1.2, ease }}
        >
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted">Postęp projektu</span>
            <span className="text-accent-2">Projekt · 3 z 4</span>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {steps.map((s, i) => (
              <div key={s.title}>
                <span className="block h-1 overflow-hidden rounded-full bg-white/10">
                  <motion.span
                    className="block h-full origin-left rounded-full bg-accent"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: i < 2 ? 1 : i === 2 ? 0.6 : 0 }}
                    transition={{ delay: 0.9 + i * 0.25, duration: 1, ease }}
                  />
                </span>
                <span className={`mt-2 block text-[12px] ${i <= 2 ? "text-ink" : "text-dim"}`}>{s.title}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <p className="relative text-[13px] text-dim">Konto zakładasz kodem z zaproszenia, które dostajesz po rozpoczęciu współpracy.</p>
    </aside>
  );
}
