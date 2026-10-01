"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ReactLenis, useLenis } from "lenis/react";
import { MotionConfig } from "motion/react";
import Loader from "./Loader";
import CookieConsent from "./CookieConsent";

const LoadedContext = createContext(false);
export const useLoaded = () => useContext(LoadedContext);

// Po zmianie podstrony: na górę albo do kotwicy (np. /#kontakt)
function RouteScroll() {
  const pathname = usePathname();
  const lenis = useLenis();
  useEffect(() => {
    if (!lenis) return;
    const hash = window.location.hash;
    if (hash) {
      const t = setTimeout(() => lenis.scrollTo(hash, { offset: -80, duration: 1.4 }), 120);
      return () => clearTimeout(t);
    }
    lenis.scrollTo(0, { immediate: true, force: true });
  }, [pathname, lenis]);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <ReactLenis root options={{ lerp: 0.1, anchors: { offset: -80, duration: 1.4 } }}>
      <MotionConfig reducedMotion="user">
        <LoadedContext.Provider value={loaded}>
          <CookieConsent ready={loaded}>
            <Loader onDone={() => setLoaded(true)} />
            <RouteScroll />
            {children}
          </CookieConsent>
        </LoadedContext.Provider>
      </MotionConfig>
    </ReactLenis>
  );
}
