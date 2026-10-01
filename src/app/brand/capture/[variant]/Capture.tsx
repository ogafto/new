"use client";

import { useEffect, useState } from "react";
import { LogoFrame, SIZE, type Variant } from "@/components/brand/AnimatedLogo";

// Wariant "-light" = jasne tło. Czas ustawia skrypt przez window.__setT(t).
export default function Capture({ variant }: { variant: string }) {
  const light = variant.endsWith("-light");
  const v = variant.replace("-light", "") as Variant;
  const [t, setT] = useState(0);
  useEffect(() => {
    (window as unknown as { __setT: (t: number) => void }).__setT = setT;
  }, []);
  const [w, h] = SIZE[v];
  return (
    <div id="stage" style={{ position: "fixed", left: 0, top: 0, width: w, height: h, zIndex: 1000 }}>
      <LogoFrame variant={v} t={t} light={light} />
    </div>
  );
}
