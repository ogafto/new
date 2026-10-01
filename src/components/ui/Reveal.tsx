"use client";

import { Fragment } from "react";
import { motion } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

// Słowa wjeżdżają jedno po drugim z rozmyciem.
export function Words({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <Fragment key={i}>
          <motion.span
            className={`inline-block ${className}`}
            initial={{ opacity: 0, y: "0.4em", filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: delay + i * 0.05, duration: 0.9, ease }}
          >
            {w}
          </motion.span>{" "}
        </Fragment>
      ))}
    </>
  );
}

export function FadeUp({
  children,
  delay = 0,
  className = "",
  y = 24,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay, duration: 0.9, ease }}
    >
      {children}
    </motion.div>
  );
}
