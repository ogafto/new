"use client";

import { motion } from "motion/react";
import { useLoaded } from "./Providers";
import { useCovering } from "./Transition";
import Button, { Magnetic } from "./ui/Button";

/*
 * Strona 404: wielkie „404.” z fioletową kropką jak w logo, krótki tekst i dwie drogi dalej.
 * Cyfry wjeżdżają od dołu jak napisy na reszcie strony.
 */

const ease = [0.16, 1, 0.3, 1] as const;

export default function NotFound() {
  const loaded = useLoaded();
  const covering = useCovering();
  const show = loaded && !covering;

  return (
    <main className="relative grid min-h-[100svh] place-items-center overflow-hidden px-5 pt-24 pb-16 sm:px-10">
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-[min(120vw,1100px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.16),transparent)]" aria-hidden />

      <div className="relative flex flex-col items-center text-center">
        <p className="h-display flex items-end overflow-hidden pb-[0.04em] text-[clamp(8rem,30vw,24rem)] leading-[0.8] tracking-[-0.07em]" aria-label="404">
          {["4", "0", "4"].map((ch, i) => (
            <motion.span key={i} className="inline-block" aria-hidden initial={{ y: "105%" }} animate={show ? { y: "0%" } : {}} transition={{ delay: 0.1 + i * 0.08, duration: 1.2, ease }}>
              {ch}
            </motion.span>
          ))}
          <motion.span className="mb-[0.06em] ml-[0.04em] inline-block size-[0.13em] bg-accent" aria-hidden initial={{ scale: 0 }} animate={show ? { scale: 1 } : {}} transition={{ delay: 0.55, duration: 0.8, ease }} />
        </p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={show ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5, duration: 1, ease }}>
          <h1 className="h-display mt-8 text-[clamp(1.9rem,4vw,3.2rem)] leading-[1] tracking-[-0.04em]">Tej strony tu nie ma.</h1>
          <p className="mx-auto mt-4 max-w-[440px] text-[17px] leading-relaxed text-muted">Adres mógł się zmienić albo ma literówkę. Zajrzyj do portfolio albo wróć na start.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Magnetic>
              <Button href="/">Wróć na stronę główną</Button>
            </Magnetic>
            <Magnetic>
              <Button href="/#portfolio" variant="outline" label="Portfolio">
                Portfolio
              </Button>
            </Magnetic>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
