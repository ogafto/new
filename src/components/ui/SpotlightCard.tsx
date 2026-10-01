"use client";

import { useRef } from "react";

// Karta z subtelnym światłem podążającym za kursorem.
export default function SpotlightCard({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "article" | "li";
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={`spotlight hairline surface relative overflow-hidden ${className}`}
      onPointerMove={(e: React.PointerEvent<HTMLElement>) => {
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </Tag>
  );
}
