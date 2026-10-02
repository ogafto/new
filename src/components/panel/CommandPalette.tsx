"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ease, Icon, ICONS } from "./kit";

/* Paleta poleceń: ⌘K / Ctrl+K — szybkie przejścia i akcje w panelu admina */

type Item = { id: string; label: string; hint?: string; icon: string; href: string; group: string; keywords?: string };

const ITEMS: Item[] = [
  { id: "kokpit", label: "Kokpit", icon: ICONS.home, href: "/panel/admin", group: "Przejdź do" },
  { id: "analityka", label: "Analityka", icon: ICONS.chart, href: "/panel/admin/analityka", group: "Przejdź do", keywords: "statystyki odwiedziny ruch" },
  { id: "kalendarz", label: "Kalendarz", icon: ICONS.calendar, href: "/panel/admin/kalendarz", group: "Przejdź do", keywords: "zlecenia terminy" },
  { id: "zapytania", label: "Zapytania", icon: ICONS.inbox, href: "/panel/admin/zapytania", group: "Przejdź do", keywords: "formularz wiadomości" },
  { id: "klienci", label: "Klienci i zaproszenia", icon: ICONS.users, href: "/panel/admin/klienci", group: "Przejdź do" },
  { id: "finanse", label: "Finanse", icon: ICONS.wallet, href: "/panel/admin/finanse", group: "Przejdź do", keywords: "płatności przychód koszty stripe" },
  { id: "tresci", label: "Treści strony", icon: ICONS.doc, href: "/panel/admin/tresci", group: "Przejdź do", keywords: "cms hero ceny seo ogłoszenie" },
  { id: "portfolio", label: "Portfolio", icon: ICONS.grid, href: "/panel/admin/portfolio", group: "Przejdź do", keywords: "projekty realizacje" },
  { id: "marka", label: "Marka i logo", icon: ICONS.brand, href: "/panel/admin/marka", group: "Przejdź do", keywords: "animacje grafiki kolory banery" },
  { id: "ustawienia", label: "Ustawienia", icon: ICONS.gear, href: "/panel/admin/ustawienia", group: "Przejdź do", keywords: "resend discord stripe klucze env" },
  { id: "logi", label: "Logi", icon: ICONS.logs, href: "/panel/admin/logi", group: "Przejdź do", keywords: "dziennik zdarzenia błędy" },
  { id: "platnosc", label: "Nowa płatność", hint: "link Stripe, przelew", icon: ICONS.card, href: "/panel/admin/finanse?nowa=1", group: "Akcje" },
  { id: "zapros", label: "Zaproś klienta", icon: ICONS.users, href: "/panel/admin/klienci?zapros=1", group: "Akcje" },
  { id: "zlecenie", label: "Nowe zlecenie", icon: ICONS.calendar, href: "/panel/admin/kalendarz?nowe=1", group: "Akcje" },
  { id: "projekt", label: "Dodaj projekt do portfolio", icon: ICONS.plus, href: "/panel/admin/portfolio/nowy", group: "Akcje" },
  { id: "ogloszenie", label: "Ustaw ogłoszenie na stronie", icon: ICONS.bell, href: "/panel/admin/tresci#notice", group: "Akcje" },
  { id: "strona", label: "Otwórz stronę", icon: ICONS.site, href: "/", group: "Akcje", keywords: "afto.works" },
];

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const ev = () => setOpen(true);
    addEventListener("keydown", k);
    addEventListener("afto:cmdk", ev);
    return () => {
      removeEventListener("keydown", k);
      removeEventListener("afto:cmdk", ev);
    };
  }, []);
  return [open, setOpen] as const;
}

export function CommandButton() {
  return (
    <button type="button" onClick={() => dispatchEvent(new Event("afto:cmdk"))} className="hidden h-10 items-center gap-2.5 rounded-full border border-line-2 pr-2 pl-3.5 text-[13px] text-dim transition-colors hover:border-white/25 hover:text-ink sm:flex" aria-label="Szukaj (⌘K)">
      <Icon d={ICONS.search} className="size-4" />
      <span className="w-28 text-left">Szukaj…</span>
      <kbd className="rounded-md border border-line-2 px-1.5 py-0.5 font-sans text-[11px]">⌘K</kbd>
    </button>
  );
}

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const list = useMemo(() => {
    const f = fold(q.trim());
    if (!f) return ITEMS;
    // najpierw trafienia w nazwie (od początku słowa), potem w podpowiedziach i słowach kluczowych
    const score = (it: Item) => {
      const l = fold(it.label);
      if (l.startsWith(f) || l.includes(` ${f}`)) return 3;
      if (l.includes(f)) return 2;
      return fold(`${it.hint ?? ""} ${it.keywords ?? ""}`).includes(f) ? 1 : 0;
    };
    return ITEMS.map((it) => ({ it, s: score(it) }))
      .filter((x) => x.s)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.it);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setQ("");
      setI(0);
      input.current?.focus();
    }, 30);
    return () => clearTimeout(t);
  }, [open]);

  const go = (it: Item) => {
    onClose();
    if (it.href === "/") window.open("/", "_blank");
    else router.push(it.href);
  };

  let n = -1;
  const groups = [...new Set(list.map((x) => x.group))];
  // indeks w kolejności wyświetlania (grupami)
  const ordered = groups.flatMap((g) => list.filter((x) => x.group === g));

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[95] flex items-start justify-center bg-[rgb(4_4_6/0.7)] px-4 pt-[12svh] backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-label="Paleta poleceń"
            className="edge w-full max-w-[560px] overflow-hidden rounded-[24px] bg-surface shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9),0_0_80px_-30px_rgb(139_108_255/0.5)]"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.35, ease }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-line px-5">
              <Icon d={ICONS.search} className="size-[18px] text-dim" />
              <input
                ref={input}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setI(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setI((x) => Math.min(ordered.length - 1, x + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setI((x) => Math.max(0, x - 1));
                  } else if (e.key === "Enter" && ordered[i]) go(ordered[i]);
                  else if (e.key === "Escape") onClose();
                }}
                placeholder="Dokąd idziemy? Np. „płatność”, „logi”…"
                className="h-14 flex-1 bg-transparent text-[15.5px] outline-none placeholder:text-dim"
              />
              <kbd className="rounded-md border border-line-2 px-1.5 py-0.5 text-[11px] text-dim">esc</kbd>
            </div>
            <div className="max-h-[55svh] overflow-y-auto p-2" data-lenis-prevent>
              {list.length === 0 && <p className="px-4 py-10 text-center text-[13.5px] text-dim">Nic nie znaleziono.</p>}
              {groups.map((g) => (
                <div key={g} className="mb-1">
                  <p className="px-3 pt-2 pb-1.5 text-[11.5px] text-dim">{g}</p>
                  {list
                    .filter((x) => x.group === g)
                    .map((it) => {
                      n++;
                      const on = n === i;
                      const idx = n;
                      return (
                        <button key={it.id} type="button" onMouseMove={() => setI(idx)} onClick={() => go(it)} className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] transition-colors ${on ? "text-ink" : "text-muted"}`}>
                          {on && <motion.span layoutId="cmdk-hl" className="absolute inset-0 rounded-xl bg-white/[0.06]" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                          <span className={`relative grid size-8 place-items-center rounded-lg ${on ? "bg-accent/20 text-accent-2" : "bg-white/[0.04]"}`}>
                            <Icon d={it.icon} className="size-4" />
                          </span>
                          <span className="relative flex-1">
                            {it.label}
                            {it.hint && <span className="ml-2 text-[12px] text-dim">{it.hint}</span>}
                          </span>
                          {on && <span className="relative text-[12px] text-dim">↵</span>}
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
