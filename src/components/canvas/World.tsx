"use client";

import { frames } from "@/lib/frames";
import { projects } from "@/lib/site";
import { useCanvas } from "./CanvasProvider";
import Frame from "./Frame";
import Annotations from "./Annotations";
import HeroFrame from "../frames/HeroFrame";
import ProjectFrame from "../frames/ProjectFrame";
import ProcessFrame from "../frames/ProcessFrame";
import ServicesFrame from "../frames/ServicesFrame";
import ContactFrame from "../frames/ContactFrame";
import EndFrame from "../frames/EndFrame";

const look: Record<string, { bg: string; fg: string }> = {
  start: { bg: "#0B0B0C", fg: "#F4F4F2" },
  proces: { bg: "#FFFFFF", fg: "#0B0B0C" },
  uslugi: { bg: "#F7F7F5", fg: "#0B0B0C" },
  kontakt: { bg: "#0D99FF", fg: "#FFFFFF" },
  koniec: { bg: "#0B0B0C", fg: "#F4F4F2" },
};

function content(id: string, index: number) {
  if (id === "start") return <HeroFrame />;
  if (id.startsWith("projekt-")) {
    const i = projects.findIndex((p) => `projekt-${p.slug}` === id);
    return <ProjectFrame p={projects[i]} index={i} />;
  }
  if (id === "proces") return <ProcessFrame index={index} />;
  if (id === "uslugi") return <ServicesFrame />;
  if (id === "kontakt") return <ContactFrame />;
  return <EndFrame />;
}

function colors(id: string) {
  if (look[id]) return look[id];
  const p = projects.find((x) => `projekt-${x.slug}` === id)!;
  return { bg: p.bg, fg: p.fg };
}

export default function World() {
  const { mode, spacer, worldRef, tiltRef, bgRef, threeD } = useCanvas();

  const list = frames.map((f, i) => {
    const c = colors(f.id);
    return (
      <Frame key={f.id} def={f} index={i} bg={c.bg} fg={c.fg}>
        {content(f.id, i)}
      </Frame>
    );
  });

  if (mode === "pending") return <div className="h-screen" />;

  if (mode === "flow") {
    return <main className="canvas-dots space-y-6 pt-16 pb-24">{list}</main>;
  }

  return (
    <>
      <div style={{ height: spacer }} aria-hidden />
      <main className="fixed inset-0 overflow-clip" style={{ perspective: 1900 }}>
        <div ref={bgRef} className="canvas-dots absolute inset-0" aria-hidden />
        <div ref={tiltRef} className="absolute inset-0" style={{ transformStyle: threeD ? "preserve-3d" : undefined }}>
          <div ref={worldRef} className="absolute top-0 left-0 origin-[0_0]" style={{ transformStyle: threeD ? "preserve-3d" : undefined }}>
            <Annotations />
            {list}
          </div>
        </div>
      </main>
    </>
  );
}
