"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "motion/react";
import { Mark, Wordmark } from "../brand/Logo";

const LogoScene = dynamic(() => import("../hero/LogoScene"), { ssr: false });
const ease = [0.16, 1, 0.3, 1] as const;

// Konto: szklany monogram 3D w tle, karta z „mroźnego szkła” i światłem obiegającym ramkę
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100svh] overflow-hidden">
      <motion.div className="fixed inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }} aria-hidden>
        <LogoScene ready active center />
      </motion.div>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgb(7_7_10/0.75)_75%)]" aria-hidden />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-bg to-transparent" aria-hidden />

      <header className="relative z-10 flex items-center justify-between px-5 py-6 sm:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="afto.works — strona główna">
          <Mark className="size-8" />
          <Wordmark className="h-[19px] w-auto" />
        </Link>
        <Link href="/" className="group flex items-center gap-2 rounded-full border border-line-2 bg-bg/40 px-4 py-2 text-[13.5px] text-muted backdrop-blur-md transition-colors hover:text-ink">
          <span className="transition-transform duration-500 ease-out-expo group-hover:-translate-x-1">←</span>
          Strona główna
        </Link>
      </header>

      <main className="relative z-10 flex min-h-[calc(100svh-92px)] items-center justify-center px-4 pb-16">
        <motion.div
          className="beam relative w-full max-w-[460px] rounded-[30px] bg-bg/55 p-6 shadow-[0_40px_120px_-30px_rgb(139_108_255/0.35)] backdrop-blur-2xl sm:p-9"
          initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.3, duration: 1.2, ease }}
        >
          <div className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" aria-hidden />
          {children}
        </motion.div>
      </main>
    </div>
  );
}

export const pulse = () => window.dispatchEvent(new Event("afto:pulse"));
