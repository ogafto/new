"use client";

import { FRAME_H, FRAME_W } from "@/lib/camera";
import { GX, ROW_2, ROW_3 } from "@/lib/frames";
import { projects, site } from "@/lib/site";

/* Elementy "żyjące" na płótnie poza ramkami: tekst okładki, sekcje, notatki, pomiary. */

function SectionBox({ x, y, w, h, title }: { x: number; y: number; w: number; h: number; title: string }) {
  return (
    <div className="absolute rounded-[40px] bg-black/[0.035] ring-1 ring-black/[0.05]" style={{ left: x, top: y, width: w, height: h }}>
      <span
        className="absolute top-0 left-0 rounded-full bg-white px-[0.9em] py-[0.35em] font-ui text-ink shadow-[0_1px_2px_rgb(0_0_0/0.08)]"
        style={{ fontSize: "calc(12px * var(--inv, 1))", transform: "translate(32px, 28px)" }}
      >
        {title}
      </span>
    </div>
  );
}

function Sticky({ x, y, rotate = -2, children, sign }: { x: number; y: number; rotate?: number; children: React.ReactNode; sign?: string }) {
  return (
    <div
      className="absolute w-[380px] bg-[#FFE380] p-8 font-display text-[26px] leading-[1.25] font-medium text-[#3B3000] shadow-[0_2px_4px_rgb(0_0_0/0.06),0_20px_40px_-12px_rgb(0_0_0/0.18)]"
      style={{ left: x, top: y, transform: `rotate(${rotate}deg)`, fontStretch: "92%" }}
    >
      {children}
      {sign && <p className="mt-6 font-ui text-[15px] font-normal text-[#3B3000]/60">{sign}</p>}
    </div>
  );
}

// Czerwona linia pomiaru jak po przytrzymaniu Alt w Figmie
function Measure({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  return (
    <div className="absolute" style={{ left: x, top: y1, height: y2 - y1 }}>
      <div className="absolute inset-y-0 left-0 w-[2px] bg-measure" />
      <div className="absolute top-0 -left-[7px] h-[2px] w-4 bg-measure" />
      <div className="absolute bottom-0 -left-[7px] h-[2px] w-4 bg-measure" />
      <span
        className="absolute top-1/2 left-0 -translate-y-1/2 rounded-[4px] bg-measure px-[0.45em] py-[0.15em] font-ui text-white"
        style={{ fontSize: "calc(11px * var(--inv, 1))", transform: "translate(calc(10px * var(--inv, 1)), -50%)" }}
      >
        {y2 - y1}
      </span>
    </div>
  );
}

// Ścieżka narysowana piórem — z widocznymi punktami węzłowymi
function PenPath() {
  const d = "M 200 40 C 420 40, 520 260, 300 360 S 60 520, 260 640";
  const points = [
    [200, 40],
    [300, 360],
    [260, 640],
  ];
  return (
    <svg className="absolute overflow-visible" style={{ left: GX - 60, top: 420 }} width="600" height="680" viewBox="0 0 600 680" fill="none" aria-hidden>
      <path d={d} stroke="#0D99FF" strokeWidth="3" />
      <path d="M 238 624 L 260 640 L 236 656" stroke="#0D99FF" strokeWidth="3" fill="none" />
      {points.map(([cx, cy]) => (
        <rect key={`${cx}-${cy}`} x={cx - 7} y={cy - 7} width="14" height="14" fill="white" stroke="#0D99FF" strokeWidth="2.5" />
      ))}
    </svg>
  );
}

export default function Annotations() {
  const rowW = GX * 3 + FRAME_W;
  return (
    <div aria-hidden className="pointer-events-none select-none">
      {/* okładka pliku obok pierwszej ramki */}
      <div className="absolute" style={{ left: GX + 40, top: 40, width: FRAME_W }}>
        <p className="font-ui text-[22px] text-muted">Plik / {site.domain}</p>
        <p className="mt-6 font-display text-[200px] leading-[0.82] font-semibold tracking-[-0.055em] text-ink" style={{ fontStretch: "112%" }}>
          Portfolio
          <br />
          2026
        </p>
        <div className="mt-14 grid w-[760px] grid-cols-[180px_1fr] gap-y-3 font-ui text-[22px]">
          <span className="text-muted">Autor</span>
          <span className="text-ink">
            {site.brand} — {site.role.toLowerCase()}
          </span>
          <span className="text-muted">Status</span>
          <span className="flex items-center gap-3 text-ink">
            <span className="size-3 rounded-full bg-[#14AE5C]" /> przyjmuję nowe projekty
          </span>
          <span className="text-muted">Strony</span>
          <span className="text-ink">{projects.length} realizacje · proces · usługi · kontakt</span>
        </div>
      </div>

      <Sticky x={GX + 880} y={560} rotate={3} sign="— afto">
        Cześć! To mój plik roboczy. Przewijaj albo używaj strzałek, a kamera sama przeleci przez projekty.
      </Sticky>
      <PenPath />

      <SectionBox x={-100} y={ROW_2 - 150} w={rowW + 200} h={FRAME_H + 250} title={`Realizacje · ${projects.length}`} />
      <SectionBox x={-100} y={ROW_3 - 150} w={rowW + 200} h={FRAME_H + 250} title="Współpraca" />

      <Measure x={FRAME_W / 2} y1={FRAME_H} y2={ROW_2} />

      <Sticky x={GX * 2 + 1000} y={ROW_3 - 260} rotate={-3}>
        Pobaw się właściwościami komponentu — wycena przeliczy się sama.
      </Sticky>
    </div>
  );
}
