"use client";

import { motion } from "motion/react";

// Płynne wejście treści przy każdej zmianie podstrony panelu
// (tylko przezroczystość — transform/filter psułyby okna `fixed` wewnątrz stron)
export default function PanelTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}
