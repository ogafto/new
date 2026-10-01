"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ReactLenis, useLenis } from "lenis/react";
import { MotionConfig } from "motion/react";
import Loader from "./Loader";
import CookieConsent from "./CookieConsent";
import { TransitionProvider } from "./Transition";

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
      // strona jest jeszcze pod kurtyną — od razu do kotwicy
      const t = setTimeout(() => lenis.scrollTo(hash, { offset: -80, immediate: true, force: true }), 60);
      return () => clearTimeout(t);
    }
    lenis.scrollTo(0, { immediate: true, force: true });
  }, [pathname, lenis]);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // konto i panel — bez ekranu ładowania
  const app = /^\/(konto|panel)/.test(usePathname());
  const [loaded, setLoaded] = useState(app);

  return (
    <ReactLenis root options={{ lerp: 0.1, anchors: { offset: -80, duration: 1.4 } }}>
      <MotionConfig reducedMotion="user">
        <LoadedContext.Provider value={loaded}>
          <CookieConsent ready={loaded}>
            {!loaded && !app && <Loader onDone={() => setLoaded(true)} />}
            <RouteScroll />
            <TransitionProvider>{children}</TransitionProvider>
          </CookieConsent>
        </LoadedContext.Provider>
      </MotionConfig>
    </ReactLenis>
  );
}
