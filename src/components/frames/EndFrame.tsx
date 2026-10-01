"use client";

import Link from "next/link";
import { frames } from "@/lib/frames";
import { site } from "@/lib/site";
import { useCanvas } from "../canvas/CanvasProvider";

// Litery rozciągają się pod kursorem (oś szerokości fontu).
function KineticWord({ text }: { text: string }) {
  return (
    <p aria-label={text} className="flex font-display text-[19vw] leading-[0.8] font-semibold tracking-[-0.06em] lg:text-[250px]">
      {text.split("").map((ch, i) => (
        <span
          key={i}
          aria-hidden
          className={`inline-block transition-[font-stretch,color] duration-700 ease-out-expo [font-stretch:80%] hover:[font-stretch:125%] ${ch === "." ? "text-sel" : ""}`}
        >
          {ch}
        </span>
      ))}
    </p>
  );
}

export default function EndFrame() {
  const { goTo, goToId, toggleOverview, mode } = useCanvas();
  const nav = frames.filter((f) => f.nav);

  return (
    <div className="flex min-h-[600px] flex-col justify-between gap-12 p-6 sm:p-10 lg:h-full lg:p-14">
      <div className="flex justify-between font-ui text-[13px] text-white/55 lg:text-[14px]">
        <span>Koniec pliku</span>
        <span>Dziękuję za uwagę.</span>
      </div>

      <KineticWord text={site.domain} />

      <div className="grid gap-8 font-ui text-[14px] sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto] lg:gap-16 lg:text-[15px]">
        <div className="space-y-4">
          <p className="max-w-xs text-white/55">
            {site.role}. {site.location}. {site.tagline}
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => goTo(0)} className="rounded-full border border-white/25 px-4 py-2 transition-colors hover:border-white">
              ↺ Od początku
            </button>
            {mode === "canvas" && (
              <button type="button" onClick={toggleOverview} className="rounded-full border border-white/25 px-4 py-2 transition-colors hover:border-white">
                Pokaż cały plik
              </button>
            )}
          </div>
        </div>
        <ul className="space-y-1.5">
          <li className="mb-3 text-[12px] text-white/40 uppercase">Plik</li>
          {nav.map((f) => (
            <li key={f.id}>
              <button type="button" onClick={() => goToId(f.id)} className="link-u">
                {f.nav}
              </button>
            </li>
          ))}
        </ul>
        <ul className="space-y-1.5">
          <li className="mb-3 text-[12px] text-white/40 uppercase">Social</li>
          {site.socials.map((s) => (
            <li key={s.label}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="link-u">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <ul className="space-y-1.5">
          <li className="mb-3 text-[12px] text-white/40 uppercase">Dokumenty</li>
          <li>
            <Link href="/regulamin" className="link-u">
              Regulamin
            </Link>
          </li>
          <li>
            <Link href="/polityka-prywatnosci" className="link-u">
              Polityka prywatności
            </Link>
          </li>
          <li className="pt-3 text-white/40">© {new Date().getFullYear()} {site.domain}</li>
        </ul>
      </div>
    </div>
  );
}
