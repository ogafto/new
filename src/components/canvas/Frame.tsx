"use client";

import { FRAME_H, FRAME_W } from "@/lib/camera";
import type { FrameDef } from "@/lib/frames";
import { useCanvas } from "./CanvasProvider";

type Props = {
  def: FrameDef;
  index: number;
  bg: string;
  fg: string;
  children: React.ReactNode;
};

// Artboard. Na płótnie: pozycja absolutna w świecie. W trybie pionowym: sekcja w normalnym przepływie.
export default function Frame({ def, index, bg, fg, children }: Props) {
  const { mode, overview, threeD, active, goTo, revealed, width } = useCanvas();
  const isActive = active === index;

  const body = (
    <div className="frame-body relative h-full w-full overflow-clip" style={{ background: bg, color: fg, ["--fg" as string]: fg, ["--bg" as string]: bg }}>
      {children}
    </div>
  );

  if (mode === "canvas") {
    return (
      <section
        id={def.id}
        aria-label={def.name}
        className="group/frame absolute"
        style={{
          left: def.x,
          top: def.y,
          width: FRAME_W,
          height: FRAME_H,
          transform: threeD ? `translateZ(calc(var(--ez, 0) * ${60 + (index % 5) * 45}px))` : undefined,
          opacity: revealed ? 1 : 0,
          transition: `opacity 0.6s ${index * 0.07}s`,
        }}
        onFocusCapture={() => !isActive && !overview && goTo(index)}
      >
        {/* etykieta ramki o stałym rozmiarze na ekranie */}
        <div
          className={`pointer-events-none absolute left-0 flex w-full items-end justify-between font-ui whitespace-nowrap transition-colors ${
            isActive ? "text-sel" : "text-muted"
          }`}
          style={{ bottom: "100%", paddingBottom: "calc(6px * var(--inv, 1))", fontSize: "calc(11px * var(--inv, 1))" }}
        >
          <span>{def.name}</span>
          <span className="font-mono opacity-70">
            {FRAME_W} × {FRAME_H}
          </span>
        </div>

        <div className="h-full w-full shadow-[0_1px_3px_rgb(0_0_0/0.08)]">{body}</div>

        {/* w widoku całego pliku: zaznaczenie po najechaniu + kliknięcie przenosi do ramki */}
        {overview && (
          <button
            type="button"
            onClick={() => goTo(index)}
            className="absolute inset-0 cursor-pointer outline-sel hover:outline"
            style={{ outlineWidth: "calc(2px * var(--inv, 1))" }}
            aria-label={`Przejdź do: ${def.name}`}
          />
        )}
      </section>
    );
  }

  // tryb pionowy
  const k = Math.min(1, (width - 48) / FRAME_W);
  const artboard = width >= 1024;
  return (
    <section id={def.id} aria-label={def.name} className="relative mx-auto px-3 pt-10 sm:px-6" style={artboard ? { width: FRAME_W * k + 48 } : undefined}>
      <div className="mb-2 flex justify-between font-ui text-[11px] text-muted">
        <span className={isActive ? "text-sel" : ""}>{def.name}</span>
        <span className="font-mono opacity-70">{artboard ? `${FRAME_W} × ${FRAME_H}` : "Mobile"}</span>
      </div>
      {artboard ? (
        <div style={{ width: FRAME_W * k, height: FRAME_H * k }}>
          <div style={{ width: FRAME_W, height: FRAME_H, transform: `scale(${k})`, transformOrigin: "0 0" }}>{body}</div>
        </div>
      ) : (
        <div className="shadow-[0_1px_3px_rgb(0_0_0/0.08)]">{body}</div>
      )}
    </section>
  );
}
