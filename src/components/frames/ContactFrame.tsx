"use client";

import { useState } from "react";
import { site } from "@/lib/site";
import { useCanvas } from "../canvas/CanvasProvider";
import CommentComposer from "../CommentComposer";

function CopyRow({ label, value, href }: { label: string; value: string; href: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-baseline justify-between gap-6 border-t border-white/25 py-4">
      <span className="font-ui text-[13px] text-white/60">{label}</span>
      <span className="flex min-w-0 items-baseline gap-4">
        <a href={href} className="link-u text-[18px] font-medium lg:text-[22px]">
          {value}
        </a>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            } catch {}
          }}
          className="font-ui text-[12px] text-white/60 hover:text-white"
        >
          {copied ? "Skopiowano" : "Kopiuj"}
        </button>
      </span>
    </div>
  );
}

export default function ContactFrame() {
  const { prefill, setPrefill } = useCanvas();
  return (
    <div className="grid grid-cols-1 gap-10 p-6 sm:p-10 lg:h-full lg:grid-cols-[minmax(0,1fr)_500px] lg:gap-16 lg:p-14">
      <div className="flex flex-col">
        <p className="font-ui text-[13px] text-white/70 lg:text-[14px]">Kontakt</p>
        <h2 className="mt-3 font-display text-[clamp(3rem,15vw,4.5rem)] leading-[0.86] font-semibold tracking-[-0.055em] lg:text-[136px]" style={{ fontStretch: "108%" }}>
          Pogadajmy.
        </h2>
        <p className="mt-6 max-w-md text-[18px] leading-relaxed text-white/85 lg:text-[21px]">
          Zostaw komentarz — trafi prosto do mnie. {site.responseTime}, a pierwsza rozmowa nic nie kosztuje.
        </p>
        <div className="mt-10 lg:mt-auto">
          <CopyRow label="E-mail" value={site.email} href={`mailto:${site.email}`} />
          <CopyRow label="Telefon" value={site.phone} href={`tel:${site.phone.replace(/\s/g, "")}`} />
          <div className="flex gap-6 border-t border-white/25 pt-4 font-ui text-[14px]">
            {site.socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="link-u">
                {s.label} ↗
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-[440px] overflow-hidden rounded-[14px] bg-white shadow-[0_30px_60px_-20px_rgb(0_40_90/0.45)] lg:min-h-0">
        <CommentComposer prefill={prefill} onClearPrefill={() => setPrefill("")} />
      </div>
    </div>
  );
}
