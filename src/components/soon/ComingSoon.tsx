"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "motion/react";
import type { Soon } from "@/lib/content";
import { useLoaded } from "../Providers";
import { Mark, Wordmark } from "../brand/Logo";

const LogoScene = dynamic(() => import("../hero/LogoScene"), { ssr: false });
const ease = [0.16, 1, 0.3, 1] as const;

function useCountdown(date: string) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const target = date ? new Date(date).getTime() : NaN;
    if (!Number.isFinite(target)) return;
    const tick = () => setLeft(Math.max(0, target - Date.now()));
    const t0 = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
    };
  }, [date]);
  return left;
}

function Split({ text, delay, className = "", children }: { text: string; delay: number; className?: string; children?: React.ReactNode }) {
  return (
    <span className={`inline-block ${className}`} aria-label={text}>
      {text.split(" ").map((w, wi, arr) => (
        <span key={wi} className="inline-block overflow-hidden pb-[0.12em] align-bottom whitespace-nowrap" aria-hidden>
          {[...w].map((ch, ci) => (
            <motion.span key={ci} className="inline-block" initial={{ y: "110%", rotate: 6 }} animate={{ y: 0, rotate: 0 }} transition={{ delay: delay + (wi * 4 + ci) * 0.035, duration: 1.1, ease }}>
              {ch}
            </motion.span>
          ))}
          {wi < arr.length - 1 && " "}
        </span>
      ))}
      {children}
    </span>
  );
}

// Napis z przesuwającym się błyskiem: biała kopia tekstu odsłaniana ruchomą maską gradientu (klasy .shine-* w globals.css).
// Maska i kopia przesuwają się transformacją, więc animację liczy kompozytor — wcześniejsze animowane background-position
// (gradient przycięty do tekstu) przemalowywało wielki nagłówek w każdej klatce i zajmowało GPU w 100%.
function Shine({ text, delay }: { text: string; delay: number }) {
  const words = text.split(" ");
  // błysk startuje, gdy ostatnia litera wjedzie na miejsce
  const last = Math.max(0, ...words.map((w, wi) => wi * 4 + w.length - 1));
  const start = delay + last * 0.035 + 1.1;
  return (
    <Split text={text} delay={delay} className="relative text-accent-2">
      <span className="shine-band" style={{ "--shine-delay": `${start}s` } as React.CSSProperties} aria-hidden>
        <span className="shine-track">
          <span className="block w-[calc(100%+1px)] text-white">
            {words.map((w, wi) => (
              <span key={wi} className="inline-block overflow-hidden pb-[0.12em] align-bottom whitespace-nowrap">
                {[...w].map((ch, ci) => (
                  <span key={ci} className="inline-block">
                    {ch}
                  </span>
                ))}
                {wi < words.length - 1 && " "}
              </span>
            ))}
          </span>
        </span>
      </span>
    </Split>
  );
}

const Discord = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
    <path d="M19.6 5.3A16.7 16.7 0 0015.4 4l-.5 1a15.4 15.4 0 00-5.8 0l-.5-1a16.6 16.6 0 00-4.2 1.3C1.8 9.3 1.1 13.2 1.4 17a16.8 16.8 0 005.1 2.6l1.1-1.7a10.8 10.8 0 01-1.7-.8l.4-.3a12 12 0 0011.4 0l.4.3c-.5.3-1.1.6-1.7.8l1.1 1.7a16.7 16.7 0 005.1-2.6c.4-4.4-.7-8.3-2.9-11.7zM8.7 14.7c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z" />
  </svg>
);

export default function ComingSoon({ soon, email }: { soon: Soon; email: string }) {
  const loaded = useLoaded();
  const left = useCountdown(soon.date);
  const parts = left === null ? null : [Math.floor(left / 86_400_000), Math.floor(left / 3_600_000) % 24, Math.floor(left / 60_000) % 60, Math.floor(left / 1000) % 60];
  const d = loaded ? 0.2 : 99;

  return (
    <main data-soon className="relative grid min-h-[100svh] overflow-hidden">
      {/* scena 3D jak w hero */}
      <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={loaded ? { opacity: 1 } : {}} transition={{ duration: 2.2 }} aria-hidden>
        <LogoScene ready={loaded} active center />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(7_7_10/0.15)_10%,rgb(7_7_10/0.82)_70%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bg via-bg/70 to-transparent" aria-hidden />
      {/* przesuwająca się wiązka światła */}
      <motion.div
        className="pointer-events-none absolute top-0 bottom-0 w-[30vw] bg-gradient-to-r from-transparent via-accent/10 to-transparent blur-2xl"
        initial={{ x: "-40vw" }}
        animate={loaded ? { x: "130vw" } : {}}
        transition={{ delay: 1.2, duration: 6, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
        aria-hidden
      />

      <div className="relative z-10 flex min-h-[100svh] flex-col px-5 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+20px)] sm:px-10">
        <motion.header className="flex items-center justify-between" initial={{ opacity: 0, y: -10 }} animate={loaded ? { opacity: 1, y: 0 } : {}} transition={{ delay: d, duration: 0.9, ease }}>
          <span className="flex items-center gap-3">
            <Mark className="size-8" />
            <Wordmark className="h-[19px] w-auto" />
          </span>
          <Link href="/konto/logowanie" className="group flex items-center gap-2 rounded-full border border-line-2 bg-bg/40 px-4 py-2 text-[13px] text-muted backdrop-blur-md transition-colors hover:border-white/30 hover:text-ink">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
              <circle cx="12" cy="8.5" r="3.6" />
              <path d="M4.8 19.5c1.3-3.1 4-4.7 7.2-4.7s5.9 1.6 7.2 4.7" />
            </svg>
            Panel
          </Link>
        </motion.header>

        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <motion.p className="kicker" initial={{ opacity: 0, y: 10, filter: "blur(6px)" }} animate={loaded ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}} transition={{ delay: d + 0.2, duration: 1, ease }}>
            {soon.kicker}
          </motion.p>
          <h1 className="h-display mt-7 text-[clamp(3.2rem,11vw,10rem)] leading-[0.92]">
            {loaded && <Split text={soon.title} delay={0.45} />}
            <br />
            {loaded && <Shine text={soon.accent} delay={0.75} />}
          </h1>
          <motion.p className="mt-7 max-w-[520px] text-[17px] leading-relaxed text-muted" initial={{ opacity: 0, y: 14 }} animate={loaded ? { opacity: 1, y: 0 } : {}} transition={{ delay: d + 1.1, duration: 1, ease }}>
            {soon.text}
          </motion.p>

          {parts && (
            <motion.div className="mt-10 flex gap-2.5 sm:gap-4" initial={{ opacity: 0, y: 14 }} animate={loaded ? { opacity: 1, y: 0 } : {}} transition={{ delay: d + 1.3, duration: 1, ease }} aria-label="Odliczanie">
              {["dni", "godz.", "min", "sek"].map((l, i) => (
                <div key={l} className="edge min-w-[68px] rounded-2xl bg-bg/50 px-3 py-3 backdrop-blur-md sm:min-w-[88px] sm:py-4">
                  <motion.p key={parts[i]} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35 }} className="text-[clamp(1.6rem,4vw,2.4rem)] leading-none tracking-[-0.02em] tabular-nums">
                    {String(parts[i]).padStart(2, "0")}
                  </motion.p>
                  <p className="mt-1.5 text-[11.5px] text-dim">{l}</p>
                </div>
              ))}
            </motion.div>
          )}

          <motion.div className="mt-10 flex flex-col items-center gap-4" initial={{ opacity: 0, y: 14 }} animate={loaded ? { opacity: 1, y: 0 } : {}} transition={{ delay: d + 1.45, duration: 1, ease }}>
            <a
              href={soon.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex h-[60px] items-center gap-3 overflow-hidden rounded-full bg-[#5865F2] pr-2 pl-7 text-[16px] font-medium text-white shadow-[0_20px_60px_-15px_rgb(88_101_242/0.7)] transition-transform duration-500 ease-out-expo hover:scale-[1.03]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
              <Discord />
              <span className="relative">{soon.button}</span>
              <span className="relative grid size-11 place-items-center rounded-full bg-white/15 transition-transform duration-500 group-hover:rotate-45">
                <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                  <path d="M4 12L12 4M5.5 4H12v6.5" />
                </svg>
              </span>
            </a>
            <a href={`mailto:${email}`} className="text-[13.5px] text-dim transition-colors hover:text-ink">
              albo napisz: <span className="text-muted underline decoration-white/20 underline-offset-4">{email}</span>
            </a>
          </motion.div>
        </div>

        <motion.footer className="flex items-center justify-between text-[12px] text-dim" initial={{ opacity: 0 }} animate={loaded ? { opacity: 1 } : {}} transition={{ delay: d + 1.6, duration: 1 }}>
          <span>© {new Date().getFullYear()} afto.works</span>
          <span className="flex items-center gap-2">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-accent-2/80" />
              <span className="relative size-1.5 rounded-full bg-accent-2" />
            </span>
            w przygotowaniu
          </span>
        </motion.footer>
      </div>
    </main>
  );
}
