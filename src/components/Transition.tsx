"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Mark } from "./brand/Logo";

/*
 * Przejścia między podstronami: kurtyna wjeżdża od dołu z nazwą celu,
 * pod nią zmienia się adres, potem kurtyna odjeżdża do góry.
 */

type Go = (href: string, label?: string) => void;
const Ctx = createContext<Go>(() => {});
const Covering = createContext(false);
export const usePageTransition = () => useContext(Ctx);
// true, gdy kurtyna zasłania stronę (np. żeby ciężkie rzeczy startowały dopiero po przejściu)
export const useCovering = () => useContext(Covering);

const ease = [0.76, 0, 0.24, 1] as const;
type Cover = { href: string; label: string; from: string; id: number };

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [cover, setCover] = useState<Cover | null>(null);
  const pushed = useRef(false);

  const go = useCallback<Go>(
    (href, label = "") => {
      const url = new URL(href, window.location.href);
      if (url.pathname === window.location.pathname) {
        router.push(href);
        return;
      }
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return router.push(href);
      router.prefetch(url.pathname);
      pushed.current = false;
      setCover({ href, label, from: window.location.pathname, id: Date.now() });
    },
    [router],
  );

  // nowa strona gotowa → zdejmij kurtynę
  useEffect(() => {
    if (!cover || pathname === cover.from) return;
    const t = setTimeout(() => setCover(null), 380);
    return () => clearTimeout(t);
  }, [pathname, cover]);

  // zabezpieczenie: gdyby nawigacja się nie udała
  useEffect(() => {
    if (!cover) return;
    const t = setTimeout(() => setCover(null), 6000);
    return () => clearTimeout(t);
  }, [cover]);

  return (
    <Ctx.Provider value={go}>
      <Covering.Provider value={!!cover}>{children}</Covering.Provider>
      <AnimatePresence>
        {cover && (
          <motion.div
            key={cover.id}
            className="fixed inset-0 z-[90] overflow-hidden bg-surface"
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "-100%", transition: { duration: 0.9, ease } }}
            transition={{ duration: 0.75, ease }}
            onAnimationComplete={() => {
              if (pushed.current) return;
              pushed.current = true;
              router.push(cover.href, { scroll: false });
            }}
            aria-hidden
          >
            <motion.div
              className="absolute inset-0"
              initial={{ y: "-40%" }}
              animate={{ y: "0%" }}
              exit={{ y: "40%", transition: { duration: 0.9, ease } }}
              transition={{ duration: 0.75, ease }}
            >
              <div className="line-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,#000_10%,transparent_65%)]" />
              <div className="absolute top-1/2 left-1/2 size-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.2),transparent)]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-5 text-center">
                <Mark className="size-9" />
                {cover.label && (
                  <p className="h-display overflow-hidden pt-[0.05em] pb-[0.2em] text-[clamp(2.6rem,8vw,7rem)]">
                    <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                      {cover.label}
                    </motion.span>
                  </p>
                )}
                <span className="relative h-px w-28 overflow-hidden bg-line">
                  <motion.span className="absolute inset-0 origin-left bg-accent" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.2, duration: 1.1, ease }} />
                </span>
              </div>
            </motion.div>
            {/* jasna krawędź kurtyny */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>
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
