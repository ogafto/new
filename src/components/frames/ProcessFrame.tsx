"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { steps } from "@/lib/site";
import { useCanvas } from "../canvas/CanvasProvider";

// Połączenie prototypu między krokami; kropka "przejeżdża", gdy krok jest aktywny.
function Noodle({ live, vertical }: { live: boolean; vertical?: boolean }) {
  if (vertical) {
    return (
      <svg width="24" height="44" viewBox="0 0 24 44" className="mx-auto my-1 text-sel" aria-hidden>
        <circle cx="12" cy="4" r="4" fill="currentColor" />
        <path d="M12 8 C 4 18, 20 26, 12 36" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M6 34l6 8 6-8z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="66" height="40" viewBox="0 0 66 40" className="shrink-0 self-center overflow-visible text-sel" aria-hidden>
      <circle cx="4" cy="20" r="4" fill="currentColor" />
      <path id="nd" d="M8 20 C 28 4, 36 36, 56 20" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M54 13l10 7-10 7z" fill="currentColor" />
      {live && (
        <motion.circle
          r="5"
          fill="white"
          stroke="currentColor"
          strokeWidth="2"
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          style={{ offsetPath: "path('M8 20 C 28 4, 36 36, 56 20')" }}
        />
      )}
    </svg>
  );
}

export default function ProcessFrame({ index }: { index: number }) {
  const { active, mode } = useCanvas();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const visible = mode !== "canvas" || active === index;

  useEffect(() => {
    if (!playing || !visible) return;
    const id = setInterval(() => setStep((s) => (s + 1) % steps.length), 1700);
    return () => clearInterval(id);
  }, [playing, visible]);

  return (
    <div className="flex flex-col p-6 sm:p-10 lg:h-full lg:p-14">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="fg-55 font-ui text-[13px] lg:text-[14px]">Prototyp · Współpraca</p>
          <h2 className="mt-3 font-display text-[42px] leading-[0.95] font-semibold tracking-[-0.045em] lg:text-[72px]" style={{ fontStretch: "104%" }}>
            Jak wygląda współpraca
          </h2>
        </div>
        <div className="flex items-center gap-5">
          <p className="fg-55 max-w-[260px] text-[15px] leading-snug lg:text-right">Od pierwszej wiadomości do strony online — zwykle w około 10 dni.</p>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="hidden h-10 shrink-0 items-center gap-2 rounded-lg bg-[#1e1e1e] px-4 font-ui text-[13px] font-medium text-white lg:inline-flex"
            aria-pressed={playing}
          >
            {playing ? (
              <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden>
                <rect width="3" height="12" fill="currentColor" />
                <rect x="7" width="3" height="12" fill="currentColor" />
              </svg>
            ) : (
              <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden>
                <path d="M0 0l10 6-10 6z" fill="currentColor" />
              </svg>
            )}
            {playing ? "Pauza" : "Odtwórz"}
          </button>
        </div>
      </div>

      <ol className="mt-10 flex flex-col lg:mt-auto lg:flex-row lg:items-stretch">
        {steps.map((s, i) => {
          const on = step === i;
          return (
            <li key={s.title} className="flex flex-col lg:flex-row">
              <button type="button" onClick={() => setStep(i)} className="group relative text-left lg:w-[206px]">
                <span className={`mb-2 block font-ui text-[12px] transition-colors ${on ? "text-sel" : "fg-55"}`}>Krok {i + 1}</span>
                <span
                  className={`relative flex h-full flex-col overflow-hidden rounded-[6px] border bg-white transition-all duration-500 lg:h-[360px] ${
                    on ? "border-sel shadow-[0_0_0_1.5px_var(--color-sel),0_24px_48px_-24px_rgb(13_153_255/0.5)]" : "border-black/10"
                  }`}
                >
                  <span
                    className={`flex h-[120px] items-end p-4 font-display text-[64px] leading-none font-semibold tracking-[-0.05em] transition-colors duration-500 lg:h-[150px] lg:text-[84px] ${
                      on ? "bg-sel text-white" : "bg-[#F1F1EF] text-black/15"
                    }`}
                    style={{ fontStretch: "110%" }}
                  >
                    0{i + 1}
                  </span>
                  <span className="flex flex-1 flex-col p-4">
                    <span className="font-display text-[22px] font-semibold tracking-[-0.03em]">{s.title}</span>
                    <span className="mt-1 font-mono text-[11px] text-black/45">{s.time}</span>
                    <span className="mt-3 text-[14px] leading-snug text-black/65">{s.text}</span>
                  </span>
                </span>
              </button>
              {i < steps.length - 1 && (
                <>
                  <span className="lg:hidden">
                    <Noodle live={false} vertical />
                  </span>
                  <span className="hidden px-0.5 lg:flex">
                    <Noodle live={on && playing} />
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
