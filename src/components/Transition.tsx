"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { useLenis } from "lenis/react";
import { LoaderScreen } from "./Loader";

/*
 * Przejścia między podstronami: ten sam ekran co przy pierwszym wejściu (rysujący się znak).
 * Nowa strona ładuje się pod spodem; ekran znika, gdy jest gotowa i znak zdążył się narysować.
 */

type Go = (href: string, label?: string) => void;
const Ctx = createContext<Go>(() => {});
const Covering = createContext(false);
export const usePageTransition = () => useContext(Ctx);
// true, gdy ekran przejścia zasłania stronę (np. żeby ciężkie rzeczy startowały dopiero po nim)
export const useCovering = () => useContext(Covering);

const K = 0.6; // tempo animacji znaku przy przejściach
const MIN = 1250; // minimalny czas ekranu — żeby znak zdążył się narysować
type Cover = { href: string; from: string; at: number; id: number };

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();
  const [cover, setCover] = useState<Cover | null>(null);

  const go = useCallback<Go>(
    (href) => {
      const url = new URL(href, window.location.href);
      if (url.pathname === window.location.pathname) {
        router.push(href);
        return;
      }
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return router.push(href);
      router.prefetch(url.pathname);
      lenis?.stop();
      setCover({ href, from: window.location.pathname, at: Date.now(), id: Date.now() });
    },
    [router, lenis],
  );

  // ekran zasłonił stronę → zmień adres
  useEffect(() => {
    if (!cover) return;
    const t = setTimeout(() => router.push(cover.href, { scroll: false }), 380);
    return () => clearTimeout(t);
  }, [cover, router]);

  // nowa strona gotowa → zdejmij ekran (nie wcześniej niż po MIN ms)
  useEffect(() => {
    if (!cover || pathname === cover.from) return;
    const t = setTimeout(() => setCover(null), Math.max(150, MIN - (Date.now() - cover.at)));
    return () => clearTimeout(t);
  }, [pathname, cover]);

  // zabezpieczenie: gdyby nawigacja się nie udała
  useEffect(() => {
    if (!cover) return;
    const t = setTimeout(() => setCover(null), 7000);
    return () => clearTimeout(t);
  }, [cover]);

  return (
    <Ctx.Provider value={go}>
      <Covering.Provider value={!!cover}>{children}</Covering.Provider>
      <AnimatePresence onExitComplete={() => lenis?.start()}>{cover && <LoaderScreen key={cover.id} k={K} label="Przechodzę do strony" />}</AnimatePresence>
    </Ctx.Provider>
  );
}

type LinkProps = Omit<React.ComponentProps<"a">, "href"> & { href: string; label?: string };

// Link z kurtyną (zwykłe kliknięcie); ctrl/cmd-klik działa jak zwykły link
export function TLink({ href, label, onClick, children, ...rest }: LinkProps) {
  const go = usePageTransition();
  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        const url = new URL(href, window.location.href);
        if (url.pathname === window.location.pathname) return; // kotwica na tej samej stronie — przewinie Lenis
        e.preventDefault();
        go(href, label);
      }}
    >
      {children}
    </Link>
  );
}
