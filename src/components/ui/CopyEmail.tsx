"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@/lib/site";

// Karta z adresem e-mail — kliknięcie kopiuje adres do schowka.
export default function CopyEmail({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${site.email}`;
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={`hairline surface group flex w-full items-center justify-between rounded-2xl text-left transition-colors hover:bg-white/[0.04] ${compact ? "px-4 py-3" : "px-5 py-4"}`}
      aria-label={`Skopiuj adres ${site.email}`}
    >
      <span>
        {!compact && <span className="block font-mono text-[11px] text-dim">E-mail</span>}
        <span className="text-[17px]">{site.email}</span>
      </span>
      <span className="relative h-5 overflow-hidden font-mono text-[11px] text-muted">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={copied ? "y" : "n"}
            className={`block ${copied ? "text-fig-green" : ""}`}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {copied ? "Skopiowano ✓" : "Kopiuj"}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  );
}
