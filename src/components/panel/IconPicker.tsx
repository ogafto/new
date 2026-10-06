"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { guessIcon, iconPath, SERVICE_ICONS } from "@/lib/service-icons";

/* Wybór ikony usługi — z podpowiedzią „auto” (dopasowana po nazwie) */
export default function IconPicker({ value, name, onChange }: { value: string; name: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const auto = guessIcon(name);
  const cur = value && SERVICE_ICONS[value] ? value : auto;
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] py-2 pr-4 pl-2 text-left ring-1 ring-white/[0.06] transition-colors ring-inset hover:bg-white/[0.06]">
        <span className="grid size-10 place-items-center rounded-xl bg-accent/15 text-accent-2">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={iconPath(cur)} />
          </svg>
        </span>
        <span>
          <span className="block text-[13.5px]">Ikona: {SERVICE_ICONS[cur].label}</span>
          <span className="block text-[11.5px] text-dim">{value ? "wybrana ręcznie" : "dobrana automatycznie po nazwie"} · zmień</span>
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-2 grid grid-cols-5 gap-1.5 rounded-2xl bg-white/[0.02] p-2 sm:grid-cols-7">
              {Object.entries(SERVICE_ICONS).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  title={v.label}
                  onClick={() => {
                    onChange(k === auto ? "" : k);
                    setOpen(false);
                  }}
                  className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10.5px] transition-colors ${k === cur ? "bg-accent text-white" : "text-muted hover:bg-white/[0.06] hover:text-ink"}`}
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={v.d} />
                  </svg>
                  <span className="w-full truncate text-center">{v.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
