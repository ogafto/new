"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { logout } from "@/app/konto/actions";
import { pulse, type PulseEvent } from "@/app/panel/admin/actions";
import { syncRole } from "@/app/panel/actions";
import { Mark, Wordmark } from "../brand/Logo";
import { ease, Icon, ICONS } from "./kit";
import CommandPalette, { useCommandPalette } from "./CommandPalette";

export type Note = { id: string; kind: "deadline" | "inquiry"; title: string; text: string; href: string; urgent: boolean };
type Props = { user: { name: string; email: string }; admin: boolean; notes: Note[]; counts: { inquiries: number }; sites: { id: string; name: string }[]; children: React.ReactNode };

function navFor(admin: boolean, counts: Props["counts"], sites: Props["sites"]) {
  if (admin)
    return [
      {
        group: "Przegląd",
        links: [
          { href: "/panel/admin", label: "Kokpit", icon: ICONS.home },
          { href: "/panel/admin/analityka", label: "Analityka", icon: ICONS.chart },
          { href: "/panel/admin/kalendarz", label: "Kalendarz", icon: ICONS.calendar },
        ],
      },
      {
        group: "Klienci",
        links: [
          { href: "/panel/admin/zapytania", label: "Zapytania", icon: ICONS.inbox, badge: counts.inquiries },
          { href: "/panel/admin/klienci", label: "Klienci", icon: ICONS.users },
        ],
      },
      { group: "Biznes", links: [{ href: "/panel/admin/finanse", label: "Finanse", icon: ICONS.wallet }] },
      {
        group: "Treści",
        links: [
          { href: "/panel/admin/tresci", label: "Treści strony", icon: ICONS.doc },
          { href: "/panel/admin/portfolio", label: "Portfolio", icon: ICONS.grid },
          { href: "/panel/admin/marka", label: "Marka i logo", icon: ICONS.brand },
        ],
      },
      {
        group: "System",
        links: [
          { href: "/panel/admin/ustawienia", label: "Ustawienia", icon: ICONS.gear },
          { href: "/panel/admin/logi", label: "Logi", icon: ICONS.logs },
        ],
      },
    ];
  return [{ group: "Twój panel", links: [{ href: "/panel", label: "Przegląd", icon: ICONS.home }, ...sites.map((s) => ({ href: `/panel/strona/${s.id}`, label: s.name, icon: ICONS.layers }))] }];
}

// Puls panelu: licznik „na stronie” + powiadomienia o wpłatach i zapytaniach na żywo (bez przeładowania)
function Live() {
  const router = useRouter();
  const [n, setN] = useState<number | null>(null);
  const [toasts, setToasts] = useState<PulseEvent[]>([]);
  // powiadomienia przez portal — nagłówek ma backdrop-filter, który „łapie” elementy fixed
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    let alive = true;
    let since = Date.now();
    const seen = new Set<string>();
    const tick = () => {
      if (document.hidden) return;
      pulse(since)
        .then((r) => {
          if (!alive) return;
          setN(r.live);
          const fresh = r.events.filter((e) => !seen.has(e.id));
          if (fresh.length) {
            fresh.forEach((e) => seen.add(e.id));
            setToasts((t) => [...fresh, ...t].slice(0, 4));
            router.refresh(); // kokpit, finanse i zapytania od razu pokazują nowe dane
          }
          since = Math.max(since, r.now - 60_000);
        })
        .catch(() => {});
    };
    tick();
    const t = setInterval(tick, 8000);
    const vis = () => !document.hidden && tick();
    document.addEventListener("visibilitychange", vis);
    return () => {
      alive = false;
      clearInterval(t);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [router]);
  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts((x) => x.slice(0, -1)), 9000);
    return () => clearTimeout(t);
  }, [toasts]);

  return (
    <>
      <Link
        href="/panel/admin/analityka"
        className="flex items-center gap-2 rounded-full border border-line-2 px-3 py-1.5 text-[12.5px] text-muted transition-colors hover:text-ink"
        title="Osoby na stronie w ostatnich 5 minutach"
      >
        <span className="relative flex size-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
          <span className="relative size-2 rounded-full bg-emerald-400" />
        </span>
        <span className="tabular-nums">{n ?? "–"}</span>
        <span className="hidden sm:inline">na stronie</span>
      </Link>
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+96px)] z-[90] flex w-[min(380px,calc(100vw-32px))] flex-col gap-2 sm:right-6 lg:bottom-6">
            <AnimatePresence initial={false}>
              {toasts.map((e) => (
                <motion.div
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.5, ease }}
                  className="pointer-events-auto"
                >
                  <Link
                    href={e.href}
                    onClick={() => setToasts((t) => t.filter((x) => x.id !== e.id))}
                    className={`edge relative flex items-center gap-3.5 overflow-hidden rounded-2xl bg-surface/95 p-4 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.9)] backdrop-blur-xl ${e.kind === "payment" ? "ring-1 ring-emerald-400/30" : "ring-1 ring-accent/30"}`}
                  >
                    <span className={`absolute inset-y-0 left-0 w-1 ${e.kind === "payment" ? "bg-emerald-400" : "bg-accent"}`} />
                    <span className={`relative grid size-10 shrink-0 place-items-center rounded-xl ${e.kind === "payment" ? "bg-emerald-400/15 text-emerald-300" : "bg-accent/15 text-accent-2"}`}>
                      <motion.span
                        className={`absolute inset-0 rounded-xl ${e.kind === "payment" ? "border border-emerald-400/50" : "border border-accent/50"}`}
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 1.6, opacity: 0 }}
                        transition={{ duration: 1.4, repeat: 2 }}
                      />
                      <Icon d={e.kind === "payment" ? ICONS.wallet : ICONS.inbox} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[14.5px]">{e.title}</span>
                      <span className="block truncate text-[12.5px] text-dim">{e.text}</span>
                    </span>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </>
  );
}

function Bell({ notes }: { notes: Note[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    addEventListener("mousedown", close);
    return () => removeEventListener("mousedown", close);
  }, [open]);
  const urgent = notes.some((n) => n.urgent);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative grid size-10 place-items-center rounded-full border border-line-2 text-muted transition-colors hover:text-ink"
        aria-label={`Powiadomienia (${notes.length})`}
      >
        <motion.span animate={notes.length ? { rotate: [0, -14, 12, -8, 0] } : {}} transition={{ delay: 1, duration: 0.8 }}>
          <Icon d={ICONS.bell} className="size-[18px]" />
        </motion.span>
        {notes.length > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 grid min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-medium text-white ${urgent ? "bg-red-500" : "bg-accent"}`}>{notes.length}</span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="edge absolute top-12 right-0 z-50 w-[min(360px,calc(100vw-40px))] overflow-hidden rounded-2xl bg-surface shadow-[0_30px_60px_-20px_rgb(0_0_0/0.8)]"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          >
            <p className="border-b border-line px-4 py-3 text-[13px] text-dim">Powiadomienia</p>
            {notes.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13.5px] text-dim">Wszystko pod kontrolą ✓</p>
            ) : (
              <ul className="max-h-[360px] overflow-y-auto" data-lenis-prevent>
                {notes.map((n) => (
                  <li key={n.id}>
                    <Link href={n.href} onClick={() => setOpen(false)} className="flex gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]">
                      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.kind === "inquiry" ? "bg-accent" : n.urgent ? "bg-red-400" : "bg-amber-300"}`} />
                      <span className="min-w-0">
                        <span className="block truncate text-[14px]">{n.title}</span>
                        <span className="block truncate text-[12.5px] text-dim">{n.text}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- szybkie tworzenie ---------- */

const CREATE = [
  { href: "/panel/admin/finanse?nowa=1", label: "Płatność", sub: "link Stripe lub przelew", icon: ICONS.card },
  { href: "/panel/admin/kalendarz?nowe=1", label: "Zlecenie", sub: "termin w kalendarzu", icon: ICONS.calendar },
  { href: "/panel/admin/klienci?zapros=1", label: "Zaproszenie", sub: "konto dla klienta", icon: ICONS.users },
  { href: "/panel/admin/portfolio/nowy", label: "Projekt", sub: "do portfolio", icon: ICONS.grid },
  { href: "/panel/admin/tresci#notice", label: "Ogłoszenie", sub: "pasek na stronie", icon: ICONS.bell },
];

function CreateMenu({ open, onClose, align = "left" }: { open: boolean; onClose: () => void; align?: "left" | "up" }) {
  const ref = useRef<HTMLDivElement>(null);
  // zamykanie kliknięciem obok i klawiszem Esc (bez nakładki — pasek boczny ma backdrop-filter)
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (!ref.current?.contains(t) && !t.closest("[data-create-trigger]")) onClose();
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("pointerdown", down);
    addEventListener("keydown", key);
    return () => {
      removeEventListener("pointerdown", down);
      removeEventListener("keydown", key);
    };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            ref={ref}
            className={`edge absolute z-[76] w-[260px] overflow-hidden rounded-2xl bg-surface p-1.5 shadow-[0_30px_70px_-20px_rgb(0_0_0/0.9),0_0_60px_-25px_rgb(139_108_255/0.5)] ${align === "up" ? "bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2" : "top-[calc(100%+8px)] left-0"}`}
            initial={{ opacity: 0, y: align === "up" ? 10 : -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: align === "up" ? 10 : -6, scale: 0.97 }}
            transition={{ duration: 0.22, ease }}
          >
            {CREATE.map((c, i) => (
              <motion.div key={c.href} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03, duration: 0.3 }}>
                <Link href={c.href} onClick={onClose} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.05]">
                  <span className="grid size-8 place-items-center rounded-lg bg-white/[0.05] text-muted transition-colors group-hover:bg-accent/20 group-hover:text-accent-2">
                    <Icon d={c.icon} className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px]">{c.label}</span>
                    <span className="block text-[11.5px] text-dim">{c.sub}</span>
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

type NavLink = { href: string; label: string; icon: string; badge?: number };

const TITLES: [RegExp, string][] = [
  [/^\/panel\/admin\/portfolio\/nowy/, "Nowy projekt"],
  [/^\/panel\/admin\/portfolio\/./, "Edycja projektu"],
  [/^\/panel\/admin\/strony/, "Strony klientów"],
];

export default function PanelShell({ user, admin, notes, counts, sites, soon = false, children }: Props & { soon?: boolean }) {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const [create, setCreate] = useState<"side" | "tab" | null>(null);
  const [rail, setRail] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!userMenu) return;
    const down = (e: PointerEvent) => !userRef.current?.contains(e.target as Node) && setUserMenu(false);
    addEventListener("pointerdown", down);
    return () => removeEventListener("pointerdown", down);
  }, [userMenu]);
  const closeCreate = useCallback(() => setCreate(null), []);
  const [cmdk, setCmdk] = useCommandPalette();
  const nav = navFor(admin, counts, sites);
  const links = nav.flatMap((g) => g.links as NavLink[]);
  const active = (href: string) => (href === "/panel/admin" || href === "/panel" ? path === href : path.startsWith(href));
  const current = links.filter((l) => active(l.href)).sort((a, b) => b.href.length - a.href.length)[0];
  const title = TITLES.find(([r]) => r.test(path))?.[1] ?? current?.label ?? "Panel";

  useEffect(() => {
    const t = setTimeout(() => {
      setMenu(false);
      setCreate(null);
    }, 0);
    return () => clearTimeout(t);
  }, [path]);

  // zwinięte menu boczne — zapamiętane w przeglądarce
  useEffect(() => {
    let v = false;
    try {
      v = localStorage.getItem("afto:rail") === "1";
    } catch {}
    const t = setTimeout(() => setRail(v), 0);
    return () => clearTimeout(t);
  }, []);
  const toggleRail = () =>
    setRail((r) => {
      try {
        localStorage.setItem("afto:rail", r ? "0" : "1");
      } catch {}
      return !r;
    });

  // podpowiedź roli dla proxy (sesje sprzed tej zmiany) — raz po wejściu
  useEffect(() => {
    syncRole().catch(() => {});
  }, []);

  const navList = (compact: boolean) => (
    <nav className="space-y-6" aria-label="Panel">
      {nav.map((g, gi) => (
        <motion.div key={g.group} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + gi * 0.06, duration: 0.6, ease }}>
          {compact ? <div className="mx-auto mb-2 h-px w-6 bg-line" /> : <p className="mb-1 px-3 text-[12px] text-dim">{g.group}</p>}
          <ul className="space-y-0.5">
            {(g.links as NavLink[]).map((l) => {
              const on = active(l.href) && current?.href === l.href;
              const badge = l.badge ?? 0;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    title={compact ? l.label : undefined}
                    className={`group relative flex items-center rounded-[10px] py-2 text-[14px] transition-colors ${compact ? "justify-center px-0 py-2.5" : "gap-3 px-3"} ${on ? "text-ink" : "text-muted hover:bg-white/[0.04] hover:text-ink"}`}
                  >
                    {on && (
                      <motion.span layoutId={compact ? "panel-nav-rail" : "panel-nav"} className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent/[0.16] to-white/[0.03] ring-1 ring-accent/25" transition={{ type: "spring", stiffness: 420, damping: 36 }}>
                        <span className="absolute top-1/2 -left-[13px] h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent shadow-[0_0_14px_#8b6cff]" />
                      </motion.span>
                    )}
                    <span className={`relative transition-colors ${on ? "text-accent-2" : ""}`}>
                      <Icon d={l.icon} />
                      {compact && badge > 0 && <span className="absolute -top-1.5 -right-2 grid min-w-[16px] place-items-center rounded-full bg-accent px-1 text-[9.5px] font-medium text-white">{badge}</span>}
                    </span>
                    {!compact && <span className="relative flex-1 truncate">{l.label}</span>}
                    {!compact && badge > 0 && <span className="relative grid min-w-[20px] place-items-center rounded-full bg-accent px-1.5 text-[11px] font-medium text-white">{badge}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </motion.div>
      ))}
    </nav>
  );

  const status = admin && (
    <Link
      href="/panel/admin/tresci#soon"
      title={soon ? "Tryb zapowiedzi — strona ukryta" : "Strona online"}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12.5px] transition-colors ${rail ? "justify-center" : ""} ${soon ? "bg-amber-300/[0.07] text-amber-100 hover:bg-amber-300/10" : "text-muted hover:bg-white/[0.04] hover:text-ink"}`}
    >
      <span className="relative flex size-2 shrink-0">
        <span className={`absolute inset-0 animate-ping rounded-full ${soon ? "bg-amber-300/70" : "bg-emerald-400/70"}`} />
        <span className={`relative size-2 rounded-full ${soon ? "bg-amber-300" : "bg-emerald-400"}`} />
      </span>
      {!rail && <span className="truncate">{soon ? "Tryb zapowiedzi" : "Strona online"}</span>}
    </Link>
  );

  const userCard = (compact: boolean) => (
    <div className="relative" ref={userRef}>
      <AnimatePresence>
        {userMenu && (
          <motion.div
            className="edge absolute bottom-[calc(100%+8px)] left-0 z-[80] w-[232px] overflow-hidden rounded-2xl bg-surface p-1.5 shadow-[0_30px_70px_-20px_rgb(0_0_0/0.9)]"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2, ease }}
          >
            <div className="border-b border-line px-3 pt-2 pb-2.5">
              <p className="truncate text-[13.5px]">{user.name}</p>
              <p className="truncate text-[12px] text-dim">{user.email}</p>
            </div>
            {admin && (
              <Link href="/panel/admin/ustawienia" className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] text-muted transition-colors hover:bg-white/[0.05] hover:text-ink">
                <Icon d={ICONS.gear} className="size-4" /> Ustawienia
              </Link>
            )}
            <a href="/" target="_blank" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] text-muted transition-colors hover:bg-white/[0.05] hover:text-ink">
              <Icon d={ICONS.site} className="size-4" /> Otwórz stronę
            </a>
            <form action={logout}>
              <button type="submit" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] text-muted transition-colors hover:bg-red-400/10 hover:text-red-200">
                <Icon d={ICONS.logout} className="size-4" /> Wyloguj
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setUserMenu((o) => !o)}
        className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.04] ${compact ? "justify-center" : ""} ${userMenu ? "bg-white/[0.05]" : ""}`}
        aria-label="Konto"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-[13px] font-medium text-white shadow-[0_0_18px_-4px_rgb(139_108_255/0.8)]">{user.name.charAt(0).toUpperCase()}</span>
        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px]">{user.name}</span>
              <span className="block truncate text-[11.5px] text-dim">{admin ? "Administrator" : user.email}</span>
            </span>
            <svg viewBox="0 0 24 24" className="size-4 text-dim" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
              <path d="M8 10l4-4 4 4M8 14l4 4 4-4" />
            </svg>
          </>
        )}
      </button>
    </div>
  );

  // dolny pasek na telefonie (admin)
  const tabs: (NavLink | null)[] = admin
    ? [
        { href: "/panel/admin", label: "Kokpit", icon: ICONS.home },
        { href: "/panel/admin/zapytania", label: "Zapytania", icon: ICONS.inbox, badge: counts.inquiries },
        null,
        { href: "/panel/admin/finanse", label: "Finanse", icon: ICONS.wallet },
      ]
    : [];

  return (
    <div className={`min-h-[100svh] lg:grid ${rail ? "lg:grid-cols-[84px_1fr]" : "lg:grid-cols-[268px_1fr]"} transition-[grid-template-columns] duration-500 ease-out-expo`}>
      {/* tło panelu */}
      <div className="pointer-events-none fixed inset-0 -z-0" aria-hidden>
        <div className="absolute -top-40 right-[-10%] size-[720px] rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.10),transparent)]" />
        <div className="absolute bottom-[-20%] left-[10%] size-[620px] rounded-full bg-[radial-gradient(closest-side,rgb(180_162_255/0.05),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.035)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(80%_60%_at_60%_0%,black,transparent)]" />
      </div>

      {/* menu boczne (komputer) */}
      <motion.aside
        className={`sticky top-0 z-30 hidden h-[100svh] flex-col border-r border-line bg-[linear-gradient(180deg,rgb(18_18_24/0.85),rgb(10_10_14/0.85))] py-5 backdrop-blur-xl lg:flex ${rail ? "px-3" : "px-4"}`}
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease }}
      >
        <div className={`flex items-center ${rail ? "flex-col gap-3" : "justify-between pl-2"}`}>
          <Link href={admin ? "/panel/admin" : "/panel"} className="flex items-center gap-3" aria-label="Panel — start">
            <Mark className="size-8" />
            {!rail && <Wordmark className="h-[19px] w-auto" />}
          </Link>
          <button type="button" onClick={toggleRail} className="grid size-8 place-items-center rounded-lg text-dim transition-colors hover:bg-white/[0.05] hover:text-ink" aria-label={rail ? "Rozwiń menu" : "Zwiń menu"} title={rail ? "Rozwiń menu" : "Zwiń menu"}>
            <svg viewBox="0 0 24 24" className={`size-[18px] transition-transform duration-500 ${rail ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 5h16v14H4zM9 5v14M15.5 10l-2 2 2 2" />
            </svg>
          </button>
        </div>

        {admin && (
          <div className={`relative mt-5 flex gap-2 ${rail ? "flex-col" : ""}`}>
            <button
              type="button"
              onClick={() => setCmdk(true)}
              className={`flex h-10 items-center gap-2.5 rounded-xl border border-line-2 bg-white/[0.025] text-[13.5px] text-dim transition-colors hover:border-white/25 hover:text-ink ${rail ? "justify-center" : "flex-1 px-3"}`}
              aria-label="Szukaj (⌘K)"
              title="Szukaj (⌘K)"
            >
              <Icon d={ICONS.search} className="size-4" />
              {!rail && (
                <>
                  <span className="flex-1 text-left">Szukaj…</span>
                  <kbd className="rounded-md border border-line-2 px-1.5 text-[11px]">⌘K</kbd>
                </>
              )}
            </button>
            <button
              type="button"
              data-create-trigger
              onClick={() => setCreate(create === "side" ? null : "side")}
              className="grid h-10 w-full shrink-0 place-items-center rounded-xl bg-ink text-bg shadow-[0_8px_24px_-10px_rgb(255_255_255/0.5)] transition-colors hover:bg-white data-[rail=false]:w-10"
              data-rail={rail}
              aria-label="Nowe"
              title="Nowe"
            >
              <Icon d={ICONS.plus} className={`size-[18px] transition-transform duration-300 ${create === "side" ? "rotate-45" : ""}`} />
            </button>
            <div className="absolute top-full left-0">
              <CreateMenu open={create === "side"} onClose={closeCreate} />
            </div>
          </div>
        )}

        <div className="mt-6 -mr-2 flex-1 overflow-y-auto pr-2 pb-4 [scrollbar-width:none]" data-lenis-prevent>
          {navList(rail)}
        </div>

        <div className="space-y-1.5 border-t border-line pt-3">
          {status}
          {userCard(rail)}
        </div>
      </motion.aside>

      {/* menu pełnoekranowe (telefon/tablet) */}
      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-[70] bg-bg lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <motion.div
              className="absolute inset-0 flex flex-col overflow-y-auto px-5 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+24px)]"
              initial={{ y: 16 }}
              animate={{ y: 0 }}
              exit={{ y: 16 }}
              transition={{ duration: 0.45, ease }}
              data-lenis-prevent
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <Mark className="size-8" />
                  <Wordmark className="h-[19px] w-auto" />
                </span>
                <button type="button" onClick={() => setMenu(false)} className="grid size-10 place-items-center rounded-full border border-line-2" aria-label="Zamknij menu">
                  <Icon d={ICONS.close} className="size-4" />
                </button>
              </div>
              <div className="mt-8 flex-1">{navList(false)}</div>
              <div className="mt-8 space-y-2.5">
                {status}
                {userCard(false)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative min-w-0">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7, ease }}
          className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-line bg-bg px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-2.5 sm:px-8 lg:bg-bg/70 lg:pt-3 lg:pb-3 lg:backdrop-blur-xl"
        >
          <div className="flex min-w-0 items-center gap-3">
            {!admin && (
              <button type="button" onClick={() => setMenu(true)} className="grid size-10 shrink-0 place-items-center rounded-full border border-line-2 lg:hidden" aria-label="Menu">
                <Icon d={ICONS.menu} className="size-[18px]" />
              </button>
            )}
            <Link href={admin ? "/panel/admin" : "/panel"} className="shrink-0 lg:hidden" aria-label="Panel — start">
              <Mark className="size-8" />
            </Link>
            <nav aria-label="Ścieżka" className="flex min-w-0 items-center gap-2 text-[13.5px]">
              <span className="hidden text-dim sm:inline">Panel</span>
              <span className="hidden text-dim/60 sm:inline">/</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={title} className="truncate font-medium" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                  {title}
                </motion.span>
              </AnimatePresence>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {admin && (
              <button type="button" onClick={() => setCmdk(true)} className="grid size-10 place-items-center rounded-full border border-line-2 text-muted lg:hidden" aria-label="Szukaj">
                <Icon d={ICONS.search} className="size-[18px]" />
              </button>
            )}
            {admin && <Live />}
            {admin && <Bell notes={notes} />}
          </div>
        </motion.header>
        <main className={`relative mx-auto max-w-[1280px] px-4 py-6 sm:px-8 lg:py-10 ${admin ? "pb-[calc(env(safe-area-inset-bottom)+104px)] lg:pb-10" : ""}`}>{children}</main>
      </div>

      {/* dolny pasek nawigacji (telefon/tablet, admin) */}
      {admin && (
        <nav className="fixed inset-x-0 bottom-0 z-[60] border-t border-line bg-bg px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom)+6px)] lg:hidden" aria-label="Szybka nawigacja">
          <ul className="mx-auto grid max-w-[520px] grid-cols-5 items-end">
            {tabs.map((t, i) =>
              t ? (
                <li key={t.href}>
                  <Link href={t.href} className={`relative flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10.5px] transition-colors ${active(t.href) && current?.href === t.href ? "text-ink" : "text-dim"}`}>
                    {active(t.href) && current?.href === t.href && <motion.span layoutId="tab-hl" className="absolute -top-1.5 h-0.5 w-8 rounded-full bg-accent shadow-[0_0_12px_#8b6cff]" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                    <span className="relative">
                      <Icon d={t.icon} className="size-[21px]" />
                      {(t.badge ?? 0) > 0 && <span className="absolute -top-1.5 -right-2.5 grid min-w-[16px] place-items-center rounded-full bg-accent px-1 text-[9.5px] font-medium text-white">{t.badge}</span>}
                    </span>
                    {t.label}
                  </Link>
                </li>
              ) : (
                <li key={`c${i}`} className="relative flex justify-center">
                  <button
                    type="button"
                    data-create-trigger
                    onClick={() => setCreate(create === "tab" ? null : "tab")}
                    className="-mt-6 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-accent to-[#6d4dff] text-white shadow-[0_12px_30px_-8px_rgb(139_108_255/0.8)] ring-4 ring-bg transition-transform active:scale-95"
                    aria-label="Nowe"
                  >
                    <Icon d={ICONS.plus} className={`size-6 transition-transform duration-300 ${create === "tab" ? "rotate-45" : ""}`} />
                  </button>
                  <CreateMenu open={create === "tab"} onClose={closeCreate} align="up" />
                </li>
              ),
            )}
            <li>
              <button type="button" onClick={() => setMenu(true)} className="flex w-full flex-col items-center gap-1 rounded-xl py-1.5 text-[10.5px] text-dim" aria-label="Menu">
                <Icon d={ICONS.menu} className="size-[21px]" />
                Menu
              </button>
            </li>
          </ul>
        </nav>
      )}
      {admin && <CommandPalette open={cmdk} onClose={() => setCmdk(false)} />}
    </div>
  );
}
