"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useAnimate } from "motion/react";
import { Mark, Wordmark } from "../brand/Logo";

const LogoScene = dynamic(() => import("../hero/LogoScene"), { ssr: false });
const ease = [0.16, 1, 0.3, 1] as const;

// Karta płynnie zmienia wysokość, gdy zmienia się treść (formularz → sukces, kolejne kroki rejestracji)
function AutoHeight({ children }: { children: React.ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  useEffect(() => {
    const el = inner.current;
    const box = scope.current;
    if (!el || !box) return;
    let last = el.offsetHeight;
    let run = 0;
    const ro = new ResizeObserver(() => {
      const h = el.offsetHeight;
      if (Math.abs(h - last) > 40) {
        const id = ++run;
        box.style.overflow = "hidden";
        animate(box, { height: [box.offsetHeight, h] }, { duration: 0.6, ease }).then(() => {
          if (id !== run) return;
          box.style.height = "";
          box.style.overflow = "";
        });
      }
      last = h;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [animate, scope]);
  return (
    <div ref={scope}>
      <div ref={inner} className="relative">{children}</div>
    </div>
  );
}

// Konto: szklany monogram 3D w tle, karta z „mroźnego szkła” i światłem obiegającym ramkę
export default function AuthShell({ children }: { children: React.ReactNode }) {
  // po zalogowaniu: karta „wpada” w głąb, monogram odpływa, a panel buduje się na czystym tle
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const on = () => setLeaving(true);
    window.addEventListener("afto:leave", on);
    return () => window.removeEventListener("afto:leave", on);
  }, []);

  return (
    <div className="relative min-h-[100svh] overflow-hidden">
      <motion.div
        className="fixed inset-0"
        initial={{ opacity: 0 }}
        animate={leaving ? { opacity: 0, scale: 1.25 } : { opacity: 1, scale: 1 }}
        transition={leaving ? { duration: 0.9, ease } : { duration: 2 }}
        aria-hidden
      >
        <LogoScene ready active center />
      </motion.div>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgb(7_7_10/0.75)_75%)]" aria-hidden />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-bg to-transparent" aria-hidden />

      <motion.header animate={leaving ? { opacity: 0, y: -12 } : {}} transition={{ duration: 0.5, ease }} className="relative z-10 flex items-center justify-between px-5 py-6 sm:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="afto.works, strona główna">
          <Mark className="size-8" />
          <Wordmark className="h-[19px] w-auto" />
        </Link>
        <Link href="/" className="group flex items-center gap-2 rounded-full border border-line-2 bg-bg/40 px-4 py-2 text-[13.5px] text-muted backdrop-blur-md transition-colors hover:text-ink">
          <span className="transition-transform duration-500 ease-out-expo group-hover:-translate-x-1">←</span>
          Strona główna
        </Link>
      </motion.header>

      <main className="relative z-10 flex min-h-[calc(100svh-92px)] items-center justify-center px-4 pb-16">
        <motion.div
          className="beam relative w-full max-w-[460px] rounded-[30px] bg-bg/65 p-6 shadow-[0_40px_120px_-30px_rgb(139_108_255/0.35)] backdrop-blur-md sm:p-9"
          initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(10px)" }}
          animate={leaving ? { opacity: 0, y: 0, scale: 0.9, filter: "blur(12px)" } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={leaving ? { duration: 0.6, ease } : { delay: 0.3, duration: 1.2, ease }}
        >
          <div className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" aria-hidden />
          <AutoHeight>{children}</AutoHeight>
        </motion.div>
      </main>

      {/* gdyby panel ładował się dłużej — spokojny znak zamiast pustego ekranu */}
      {leaving && (
        <motion.div className="pointer-events-none fixed inset-0 z-20 grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.6 }} aria-hidden>
          <div className="flex flex-col items-center gap-5">
            <motion.span animate={{ opacity: [0.5, 1, 0.5], scale: [0.97, 1, 0.97] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
              <Mark className="size-10" />
            </motion.span>
            <span className="relative block h-px w-24 overflow-hidden rounded-full bg-white/10">
              <motion.span className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-accent-2 to-transparent" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }} />
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export const pulse = () => window.dispatchEvent(new Event("afto:pulse"));

// Przejście z konta do panelu: panel ładuje się w tle, a po chwili sukcesu scena się zwija i otwiera panel
export function useHandoff() {
  const router = useRouter();
  return useCallback(
    (href: string, wait = 1300) => {
      router.prefetch(href);
      // scena odpływa w trakcie ładowania panelu — panel podmienia ją, gdy tylko jest gotowy
      const t1 = setTimeout(() => window.dispatchEvent(new Event("afto:leave")), wait);
      const t2 = setTimeout(() => router.push(href), wait + 150);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    },
    [router],
  );
}
