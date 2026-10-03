"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ReactLenis, useLenis } from "lenis/react";
import { MotionConfig } from "motion/react";
import Loader from "./Loader";
import CookieConsent from "./CookieConsent";
import { TransitionProvider } from "./Transition";
import Analytics from "./Analytics";
import Announcement from "./Announcement";
import { applyContent, type Content } from "@/lib/content";

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

// Pętla Lenisa tylko w trakcie przewijania. Domyślna (autoRaf) prosiła o klatkę 60×/s także wtedy, gdy nic się nie dzieje,
// a każda taka klatka to praca przeglądarki (style, IntersectionObservery, commit) — stałe obciążenie procesora.
function LenisLoop() {
  const lenis = useLenis();
  useEffect(() => {
    if (!lenis) return;
    let id = 0;
    let quiet = 0;
    let fresh = true;
    const loop = (t: number) => {
      // po przerwie: krok jednej klatki zamiast skoku o cały czas bezczynności
      if (fresh) lenis.time = t - 1000 / 60;
      fresh = false;
      lenis.raf(t);
      quiet = lenis.isScrolling ? 0 : quiet + 1;
      if (quiet > 30) {
        id = 0;
        fresh = true;
      } else id = requestAnimationFrame(loop);
    };
    const kick = () => {
      quiet = 0;
      if (!id) id = requestAnimationFrame(loop);
    };
    const offInput = lenis.on("virtual-scroll", kick);
    const offScroll = lenis.on("scroll", kick);
    // przewijanie z kodu (kotwice, przyciski, „Do góry”) też musi uruchomić pętlę
    // (instancja Lenisa to zwykły obiekt spoza Reacta — podmiana metody jest celowa i cofana przy sprzątaniu)
    const scrollTo = lenis.scrollTo;
    // eslint-disable-next-line react-hooks/immutability
    lenis.scrollTo = (...args: Parameters<typeof scrollTo>) => {
      scrollTo.apply(lenis, args);
      kick();
    };
    kick();
    return () => {
      offInput();
      offScroll();
      lenis.scrollTo = scrollTo;
      cancelAnimationFrame(id);
    };
  }, [lenis]);
  return null;
}

export default function Providers({ children, content, gaId }: { children: React.ReactNode; content: Content; gaId: string }) {
  // treści z panelu (kontakt, ceny, hero…) — podmieniane zanim wyrenderują się komponenty strony
  useMemo(() => applyContent(content), [content]);
  // konto i panel — bez ekranu ładowania
  const app = /^\/(konto|panel)/.test(usePathname());
  const [loaded, setLoaded] = useState(app);

  return (
    <ReactLenis root options={{ lerp: 0.1, anchors: { offset: -80, duration: 1.4 }, autoRaf: false }}>
      <LenisLoop />
      <MotionConfig reducedMotion="user">
        <LoadedContext.Provider value={loaded}>
          <CookieConsent ready={loaded} gaId={gaId}>
            {!loaded && !app && <Loader onDone={() => setLoaded(true)} />}
            <RouteScroll />
            <Analytics />
            <TransitionProvider>
              {children}
              <Announcement />
            </TransitionProvider>
          </CookieConsent>
        </LoadedContext.Provider>
      </MotionConfig>
    </ReactLenis>
  );
}
