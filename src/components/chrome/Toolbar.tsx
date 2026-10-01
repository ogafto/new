"use client";

import { AnimatePresence, motion } from "motion/react";
import { frames } from "@/lib/frames";
import { useCanvas } from "../canvas/CanvasProvider";
import CommentComposer from "../CommentComposer";
import Tip from "./Tip";

function Icon({ d, label, kbd, onClick, pressed }: { d: React.ReactNode; label: string; kbd?: string; onClick?: () => void; pressed?: boolean }) {
  return (
    <span className="group relative">
      <button type="button" onClick={onClick} className="ui-icon" aria-label={label} aria-pressed={pressed}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {d}
        </svg>
      </button>
      <Tip label={label} kbd={kbd} />
    </span>
  );
}

// Dolny pasek narzędzi + licznik ramek + zoom (tylko w trybie płótna).
export default function Toolbar() {
  const { mode, active, goTo, zoom, overview, toggleOverview, commentOpen, setCommentOpen, revealed, prefill, setPrefill } = useCanvas();
  if (mode !== "canvas") return null;

  return (
    <>
      <motion.div
        className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2"
        initial={{ opacity: 0, y: 16 }}
        animate={revealed ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 2.6, duration: 0.6 }}
      >
        <div className="ui-panel flex h-12 items-center gap-0.5 px-1.5">
          <Icon label="Poprzednia ramka" kbd="←" onClick={() => goTo(active - 1)} d={<path d="M11 4L6 9l5 5" />} />
          <Icon label="Następna ramka" kbd="→" onClick={() => goTo(active + 1)} d={<path d="M7 4l5 5-5 5" />} />
          <span className="mx-1 h-5 w-px bg-black/10" />
          <Icon label="Przesuwanie" kbd="V" pressed={!commentOpen && !overview} d={<path d="M4 3l10 5-4.2 1.3L8 13.5z" fill="currentColor" />} />
          <Icon
            label="Komentarz"
            kbd="C"
            pressed={commentOpen}
            onClick={() => setCommentOpen(!commentOpen)}
            d={<path d="M3.5 4.5h11v7.5H8L4.5 14.5V12h-1z" />}
          />
          <span className="mx-1 h-5 w-px bg-black/10" />
          <Icon
            label="Pokaż cały plik"
            kbd="⇧1"
            pressed={overview}
            onClick={toggleOverview}
            d={
              <>
                <rect x="3" y="3" width="5" height="5" rx="0.5" />
                <rect x="10" y="3" width="5" height="5" rx="0.5" />
                <rect x="3" y="10" width="5" height="5" rx="0.5" />
                <rect x="10" y="10" width="5" height="5" rx="0.5" />
              </>
            }
          />
        </div>
      </motion.div>

      <motion.div
        className="ui-panel fixed bottom-4 left-3 z-50 flex h-10 items-center gap-2 px-3 text-[12px] text-black/55"
        initial={{ opacity: 0 }}
        animate={revealed ? { opacity: 1 } : {}}
        transition={{ delay: 2.8 }}
      >
        <span className="font-mono text-ink tabular-nums">
          {active + 1}/{frames.length}
        </span>
        <span className="max-w-[220px] truncate">{overview ? "Cały plik" : frames[active].name}</span>
      </motion.div>

      <motion.div
        className="ui-panel fixed right-3 bottom-4 z-50 flex h-10 items-center px-3 font-mono text-[12px] text-ink tabular-nums"
        initial={{ opacity: 0 }}
        animate={revealed ? { opacity: 1 } : {}}
        transition={{ delay: 2.8 }}
        aria-label={`Powiększenie ${zoom}%`}
      >
        {zoom}%
      </motion.div>

      <AnimatePresence>
        {commentOpen && (
          <motion.div
            className="ui-panel fixed bottom-20 left-1/2 z-50 h-[400px] w-[440px] -translate-x-1/2 overflow-hidden"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            style={{ transformOrigin: "50% 100%" }}
          >
            <button type="button" onClick={() => setCommentOpen(false)} className="ui-icon absolute top-1.5 right-1.5 z-10 size-8" aria-label="Zamknij">
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
            <CommentComposer compact prefill={prefill} onClearPrefill={() => setPrefill("")} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
