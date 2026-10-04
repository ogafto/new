"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import CmsEditor, { type ColWithEntries } from "../CmsEditor";
import LiveSite from "../LiveSite";

type Mode = "edit" | "live" | "split";

/* Edycja strony klienta: same formularze, sam podgląd na żywo albo oba obok siebie (duże ekrany) */
export default function SiteWorkspace({ siteId, href, collections }: { siteId: string; href: string | null; collections: ColWithEntries[] }) {
  const [mode, setMode] = useState<Mode>("edit");
  // na dużym ekranie od razu obok siebie — klient widzi efekt każdej zmiany
  useEffect(() => {
    const t = setTimeout(() => href && matchMedia("(min-width: 1536px)").matches && setMode("split"), 0);
    return () => clearTimeout(t);
  }, [href]);
  if (!href) return <CmsEditor siteId={siteId} collections={collections} />;
  const items: { v: Mode; label: string; wide?: boolean }[] = [
    { v: "edit", label: "Edycja" },
    { v: "live", label: "Podgląd na żywo" },
    { v: "split", label: "Obok siebie", wide: true },
  ];
  return (
    <>
      <div className="mb-4 inline-flex rounded-full bg-white/[0.04] p-1">
        {items.map((it) => (
          <button key={it.v} type="button" onClick={() => setMode(it.v)} className={`relative rounded-full px-4 py-2 text-[13.5px] transition-colors ${it.wide ? "hidden xl:block" : ""} ${mode === it.v ? "text-bg" : "text-muted hover:text-ink"}`}>
            {mode === it.v && <motion.span layoutId="ws-mode" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 480, damping: 40 }} />}
            <span className="relative">{it.label}</span>
          </button>
        ))}
      </div>
      {mode === "edit" && <CmsEditor siteId={siteId} collections={collections} />}
      {mode === "live" && <LiveSite siteId={siteId} href={href} tall />}
      {mode === "split" && (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <CmsEditor siteId={siteId} collections={collections} compact />
          <div className="xl:sticky xl:top-4">
            <LiveSite siteId={siteId} href={href} />
          </div>
        </div>
      )}
    </>
  );
}
