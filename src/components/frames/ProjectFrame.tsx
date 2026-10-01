"use client";

import { projects, site, type Project } from "@/lib/site";
import { useCanvas } from "../canvas/CanvasProvider";
import MockSite from "../MockSite";

// Studium projektu: makieta + "specyfikacja" jak w panelu Inspect.
export default function ProjectFrame({ p, index }: { p: Project; index: number }) {
  const { goToId } = useCanvas();

  return (
    <div className="grid grid-cols-1 gap-8 p-6 sm:p-10 lg:h-full lg:grid-cols-[840px_minmax(0,1fr)] lg:gap-14 lg:p-14">
      {/* makieta */}
      <div className="flex flex-col">
        <div className="fg-55 mb-4 flex justify-between font-ui text-[13px] lg:text-[14px]">
          <span>
            Realizacja {String(index + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
          </span>
          <span className="font-mono">
            {p.slug}.{site.domain}
          </span>
        </div>
        <div className="group/mock relative">
          <div className="@container relative aspect-[16/10] overflow-hidden rounded-[10px] shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_30px_60px_-30px_rgb(0_0_0/0.45)]">
            <MockSite theme={p.theme} />
          </div>
          <span className="pointer-events-none absolute -inset-[4px] rounded-[13px] border-[1.5px] border-sel opacity-0 transition-opacity group-hover/mock:opacity-100" />
          <span className="pointer-events-none absolute right-3 bottom-3 rounded-md bg-[#1e1e1e] px-2.5 py-1.5 font-ui text-[12px] text-white opacity-0 transition-opacity group-hover/mock:opacity-100">
            Przewijam stronę…
          </span>
        </div>
        <ul className="mt-5 flex flex-wrap gap-2 font-ui text-[13px] lg:mt-auto">
          {p.scope.map((s) => (
            <li key={s} className="line-fg rounded-full border px-3.5 py-1.5">
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* specyfikacja */}
      <div className="flex flex-col">
        <p className="fg-55 font-ui text-[13px] lg:text-[14px]">
          {p.category} · {p.year}
        </p>
        <h2 className="mt-3 font-display text-[52px] leading-[0.9] font-semibold tracking-[-0.045em] lg:text-[72px]" style={{ fontStretch: "106%" }}>
          {p.name}
        </h2>
        <p className="fg-70 mt-6 text-[17px] leading-relaxed lg:text-[18px]">{p.description}</p>

        <div className="line-fg mt-8 space-y-6 border-t pt-6 font-ui">
          <div>
            <p className="fg-55 mb-3 text-[12px] tracking-wide uppercase">Kolory</p>
            <div className="flex gap-3">
              {p.palette.map((c) => (
                <div key={c} className="flex-1">
                  <span className="line-fg block aspect-square w-full max-w-[64px] rounded-md border" style={{ background: c }} />
                  <span className="fg-55 mt-1.5 block font-mono text-[11px]">{c}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="fg-55 mb-3 text-[12px] tracking-wide uppercase">Typografia</p>
            <div className="space-y-2">
              {p.fonts.map((f) => (
                <div key={f.name} className="flex items-baseline gap-4">
                  <span className={`w-14 text-[34px] leading-none ${f.className}`}>Aa</span>
                  <span className="text-[14px]">{f.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button type="button" onClick={() => goToId("kontakt")} className="pill pill-line mt-8 self-start lg:mt-auto">
          Chcę podobny projekt <span className="arr">→</span>
        </button>
      </div>
    </div>
  );
}
