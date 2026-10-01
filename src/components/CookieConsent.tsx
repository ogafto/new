"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { AnimatePresence, motion } from "motion/react";

/*
 * Zgoda na pliki cookies (RODO + Google Consent Mode v2).
 * Wybór zapisywany w ciasteczku `afto_consent` na 180 dni.
 * Google Analytics ładuje się dopiero po zgodzie na "Analityczne" i tylko gdy ustawisz NEXT_PUBLIC_GA_ID.
 */

export type Consent = { necessary: true; analytics: boolean; marketing: boolean; date: string; v: 1 };
const COOKIE = "afto_consent";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const ease = [0.16, 1, 0.3, 1] as const;

const ConsentContext = createContext<Consent | null>(null);
export const useConsent = () => useContext(ConsentContext);

export function openCookieSettings() {
  window.dispatchEvent(new Event("afto:cookies"));
}

function read(): Consent | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
  if (!m) return null;
  try {
    const c = JSON.parse(decodeURIComponent(m[1]));
    return c?.v === 1 ? c : null;
  } catch {
    return null;
  }
}

function write(c: Consent) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(c))}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax${secure}`;
}

type Gtag = (...args: unknown[]) => void;
function updateGoogle(c: Consent) {
  const g = (window as unknown as { gtag?: Gtag }).gtag;
  g?.("consent", "update", {
    analytics_storage: c.analytics ? "granted" : "denied",
    ad_storage: c.marketing ? "granted" : "denied",
    ad_user_data: c.marketing ? "granted" : "denied",
    ad_personalization: c.marketing ? "granted" : "denied",
  });
}

function Toggle({ on, onChange, disabled, label }: { on: boolean; onChange?: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 disabled:opacity-50 ${on ? "bg-accent" : "bg-white/15"}`}
    >
      <span className={`absolute top-1 size-4 rounded-full bg-white transition-all duration-300 ease-out-expo ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}

export default function CookieConsent({ children, ready }: { children: React.ReactNode; ready: boolean }) {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [banner, setBanner] = useState(false);
  const [settings, setSettings] = useState(false);
  const [draft, setDraft] = useState({ analytics: false, marketing: false });
  // w panelu i na stronach konta baner nie przeszkadza
  const app = /^\/(panel|konto)/.test(usePathname());

  useEffect(() => {
    const t = setTimeout(() => {
      const c = read();
      setConsent(c);
      if (c) setDraft({ analytics: c.analytics, marketing: c.marketing });
    }, 0);
    const open = () => {
      setSettings(true);
      setBanner(false);
    };
    window.addEventListener("afto:cookies", open);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afto:cookies", open);
    };
  }, []);

  // baner pokazuje się po zakończeniu animacji wejścia, jeśli nie ma zapisanego wyboru
  useEffect(() => {
    if (!ready) return;
    // baner potrzebny tylko, gdy są opcjonalne cookies (Google Analytics)
    const t = setTimeout(() => setBanner(!!GA_ID && !read()), 1200);
    return () => clearTimeout(t);
  }, [ready]);

  const save = useCallback((analytics: boolean, marketing: boolean) => {
    const c: Consent = { necessary: true, analytics, marketing, date: new Date().toISOString(), v: 1 };
    write(c);
    setConsent(c);
    setDraft({ analytics, marketing });
    setBanner(false);
    setSettings(false);
    updateGoogle(c);
  }, []);

  return (
    <ConsentContext.Provider value={consent}>
      {children}

      {GA_ID && consent?.analytics && (
        <>
          <Script id="gtag-consent" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{analytics_storage:'granted',ad_storage:'${consent.marketing ? "granted" : "denied"}',ad_user_data:'${consent.marketing ? "granted" : "denied"}',ad_personalization:'${consent.marketing ? "granted" : "denied"}'});
gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
          </Script>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        </>
      )}

      <AnimatePresence>
        {banner && !settings && !app && (
          <motion.div
            role="dialog"
            aria-label="Pliki cookies"
            className="edge fixed right-4 bottom-4 left-4 z-[70] max-w-[420px] rounded-[22px] bg-surface/95 p-6 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl sm:right-auto sm:left-6 sm:bottom-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.7, ease }}
          >
            <p className="text-[16px] text-ink">Pliki cookies</p>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              Używam niezbędnych plików cookies. Za Twoją zgodą włączę też Google Analytics, żeby lepiej rozumieć, jak korzystasz ze strony.{" "}
              <Link href="/polityka-prywatnosci" className="text-ink underline decoration-white/30 underline-offset-4">
                Więcej
              </Link>
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => save(true, false)} className="h-10 rounded-full bg-ink px-5 text-[14px] font-medium text-bg transition-colors hover:bg-white">
                Akceptuję
              </button>
              <button type="button" onClick={() => save(false, false)} className="h-10 rounded-full border border-line-2 px-5 text-[14px] transition-colors hover:border-white/40">
                Tylko niezbędne
              </button>
              <button type="button" onClick={() => setSettings(true)} className="link-u h-10 px-2 text-[14px] text-muted hover:text-ink">
                Ustawienia
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settings && (
          <motion.div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSettings(false)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Ustawienia cookies"
              data-lenis-prevent
              className="edge max-h-[90svh] w-full max-w-[520px] overflow-y-auto rounded-[26px] bg-surface p-7"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.6, ease }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="h-display text-[30px]">Ustawienia cookies</p>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                Statystyki odwiedzin zbieram anonimowo, bez plików cookies. Opcjonalne jest tylko Google Analytics{GA_ID ? "" : " (obecnie wyłączone)"}.
              </p>
              <ul className="mt-6 space-y-2">
                {[
                  { key: "necessary", name: "Niezbędne", text: "Zapamiętanie Twojego wyboru i logowanie do panelu klienta. Bez nich strona nie działa poprawnie.", on: true, fixed: true, list: ["afto_consent · 180 dni", "afto_session · 30 dni"] },
                  { key: "analytics", name: "Analityczne", text: "Google Analytics — statystyki odwiedzin. Włączają się tylko za Twoją zgodą.", on: draft.analytics, list: ["_ga, _ga_* · do 2 lat"] },
                ].map((r) => (
                  <li key={r.key} className="rounded-2xl border border-line p-4">
                    <div className="flex items-start justify-between gap-6">
                      <span>
                        <span className="flex items-center gap-2 text-[15px]">
                          {r.name}
                          {r.fixed && <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-dim">zawsze aktywne</span>}
                        </span>
                        <span className="mt-1 block text-[13px] leading-relaxed text-muted">{r.text}</span>
                      </span>
                      <Toggle label={r.name} on={r.on} disabled={r.fixed} onChange={(v) => setDraft((d) => ({ ...d, [r.key]: v, marketing: false }))} />
                    </div>
                    <details className="group mt-3">
                      <summary className="cursor-pointer list-none text-[12.5px] text-dim transition-colors hover:text-ink">
                        <span className="group-open:hidden">Pokaż pliki ↓</span>
                        <span className="hidden group-open:inline">Ukryj pliki ↑</span>
                      </summary>
                      <ul className="mt-2 space-y-1 font-mono text-[12px] text-muted">
                        {r.list.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </details>
                  </li>
                ))}
              </ul>
              <Link href="/polityka-prywatnosci" onClick={() => setSettings(false)} className="link-u mt-5 inline-block text-[13.5px] text-muted hover:text-ink">
                Polityka prywatności →
              </Link>
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => save(false, false)} className="h-10 rounded-full border border-line-2 px-5 text-[14px] transition-colors hover:border-white/40">
                  Tylko niezbędne
                </button>
                <button type="button" onClick={() => save(draft.analytics, false)} className="h-10 rounded-full bg-ink px-5 text-[14px] font-medium text-bg transition-colors hover:bg-white">
                  Zapisz wybór
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConsentContext.Provider>
  );
}
