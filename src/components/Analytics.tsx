"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/*
 * Własna analityka (bez ciasteczek i bez danych osobowych): odsłony, czas na stronie,
 * jak głęboko przewinięto, które sekcje zobaczono, w co kliknięto.
 * Własne zdarzenia: window.dispatchEvent(new CustomEvent("afto:track", { detail: { type, label, value } })).
 */

const SKIP = /^\/(panel|konto|brand\/capture|media)/;

function send(data: Record<string, unknown>) {
  const body = JSON.stringify(data);
  if (navigator.sendBeacon?.(`/api/t`, new Blob([body], { type: "text/plain" }))) return;
  fetch("/api/t", { method: "POST", body, keepalive: true }).catch(() => {});
}

export default function Analytics() {
  const path = usePathname();

  useEffect(() => {
    if (SKIP.test(path)) return;
    const pv = crypto.randomUUID();
    const q = new URLSearchParams(location.search);
    send({ t: "pv", id: pv, path, ref: document.referrer, us: q.get("utm_source"), um: q.get("utm_medium"), uc: q.get("utm_campaign"), w: innerWidth, lang: navigator.language });

    let active = 0;
    let since = document.visibilityState === "visible" ? performance.now() : 0;
    let maxScroll = 0;
    let section: string | null = null;
    const seen = new Set<string>();
    const elapsed = () => active + (since ? performance.now() - since : 0);

    const ping = () => send({ t: "ping", id: pv, d: Math.round(elapsed()), s: maxScroll, sec: section });
    const ev = (type: string, label?: string | null, value?: string | null) => send({ t: "ev", id: pv, type, label, value });

    const onScroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      const p = h > 0 ? Math.round((scrollY / h) * 100) : 100;
      if (p > maxScroll) maxScroll = Math.min(100, p);
    };
    onScroll();

    // sekcje: która jest „na środku” ekranu + pierwsze wejście w każdą
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const sid = (e.target as HTMLElement).id;
          section = sid;
          if (!seen.has(sid)) {
            seen.add(sid);
            ev("section", sid);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    const observe = () => document.querySelectorAll("main section[id], section[id]").forEach((el) => io.observe(el));
    observe();
    const mo = setTimeout(observe, 1500);

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest("a, button");
      if (!el) return;
      const label = (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
      ev("click", label || el.tagName.toLowerCase(), el.getAttribute("href"));
    };
    const onCustom = (e: Event) => {
      const d = (e as CustomEvent<{ type?: string; label?: string; value?: string }>).detail ?? {};
      ev(d.type || "custom", d.label, d.value);
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        if (since) active += performance.now() - since;
        since = 0;
        ping();
      } else since = performance.now();
    };
    const timer = setInterval(() => document.visibilityState === "visible" && ping(), 15000);

    addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick, true);
    addEventListener("afto:track", onCustom);
    document.addEventListener("visibilitychange", onVis);
    addEventListener("pagehide", ping);

    return () => {
      ping();
      clearInterval(timer);
      clearTimeout(mo);
      io.disconnect();
      removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      removeEventListener("afto:track", onCustom);
      document.removeEventListener("visibilitychange", onVis);
      removeEventListener("pagehide", ping);
    };
  }, [path]);

  return null;
}

export const track = (type: string, label?: string, value?: string) => window.dispatchEvent(new CustomEvent("afto:track", { detail: { type, label, value } }));
