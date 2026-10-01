"use client";

import { createContext, useContext, useState } from "react";
import { ReactLenis } from "lenis/react";
import { MotionConfig } from "motion/react";
import Loader from "./Loader";
import CursorTag from "./figma/CursorTag";

const LoadedContext = createContext(false);
export const useLoaded = () => useContext(LoadedContext);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <ReactLenis root options={{ lerp: 0.1, anchors: { offset: -72 } }}>
      <MotionConfig reducedMotion="user">
        <LoadedContext.Provider value={loaded}>
          <Loader onDone={() => setLoaded(true)} />
          <CursorTag />
          {children}
        </LoadedContext.Provider>
      </MotionConfig>
    </ReactLenis>
  );
}
