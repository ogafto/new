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

function CreateMenu({ open, onClose, align = "left" }: { open: boolean; onClose: () => void; align?: "left" | "up" | "right" }) {
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
            className={`edge absolute z-[76] w-[260px] overflow-hidden rounded-2xl bg-surface p-1.5 shadow-[0_30px_70px_-20px_rgb(0_0_0/0.9),0_0_60px_-25px_rgb(139_108_255/0.5)] ${align === "up" ? "bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2" : align === "right" ? "top-[calc(100%+10px)] right-0" : "top-[calc(100%+8px)] left-0"}`}
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
type Section = { id: string; label: string; icon: string; links: NavLink[] };

// 4 główne sekcje (zamiast długiego menu) — podstrony jako zakładki pod tytułem
function sectionsFor(admin: boolean, counts: Props["counts"], sites: Props["sites"]): Section[] {
  if (!admin) return [{ id: "panel", label: "Panel", icon: ICONS.home, links: [{ href: "/panel", label: "Przegląd", icon: ICONS.home }, ...sites.map((s) => ({ href: `/panel/strona/${s.id}`, label: s.name, icon: ICONS.layers }))] }];
  return [
    { id: "kokpit", label: "Kokpit", icon: ICONS.home, links: [{ href: "/panel/admin", label: "Kokpit", icon: ICONS.home }] },
    {
      id: "klienci",
      label: "Klienci",
      icon: ICONS.users,
      links: [
        { href: "/panel/admin/zapytania", label: "Zapytania", icon: ICONS.inbox, badge: counts.inquiries },
        { href: "/panel/admin/klienci", label: "Klienci", icon: ICONS.users },
        { href: "/panel/admin/kalendarz", label: "Kalendarz", icon: ICONS.calendar },
      ],
    },
    {
      id: "biznes",
      label: "Biznes",
      icon: ICONS.wallet,
      links: [
        { href: "/panel/admin/finanse", label: "Finanse", icon: ICONS.wallet },
        { href: "/panel/admin/analityka", label: "Analityka", icon: ICONS.chart },
      ],
    },
    {
      id: "strona",
      label: "Strona",
      icon: ICONS.globe,
      links: [
        { href: "/panel/admin/tresci", label: "Treści", icon: ICONS.doc },
        { href: "/panel/admin/portfolio", label: "Portfolio", icon: ICONS.grid },
        { href: "/panel/admin/marka", label: "Marka i logo", icon: ICONS.brand },
      ],
    },
    {
      id: "system",
      label: "System",
      icon: ICONS.gear,
      links: [
        { href: "/panel/admin/ustawienia", label: "Ustawienia", icon: ICONS.gear },
        { href: "/panel/admin/logi", label: "Logi", icon: ICONS.logs },
      ],
    },
  ];
}

export default function PanelShell({ user, admin, notes, counts, sites, soon = false, children }: Props & { soon?: boolean }) {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const [create, setCreate] = useState<"top" | "tab" | null>(null);
  const closeCreate = useCallback(() => setCreate(null), []);
  const [userMenu, setUserMenu] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [cmdk, setCmdk] = useCommandPalette();

  const sections = sectionsFor(admin, counts, sites);
  const links = sections.flatMap((x) => x.links);
  const active = (href: string) => (href === "/panel/admin" || href === "/panel" ? path === href : path.startsWith(href));
  const current = links.filter((l) => active(l.href)).sort((a, b) => b.href.length - a.href.length)[0];
  const section = sections.find((x) => x.links.some((l) => l.href === current?.href)) ?? sections[0];
  const main = sections.filter((x) => x.id !== "system");
  const inquiries = counts.inquiries;

  useEffect(() => {
    const t = setTimeout(() => {
      setMenu(false);
      setCreate(null);
      setUserMenu(false);
    }, 0);
    return () => clearTimeout(t);
  }, [path]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!userMenu) return;
    const down = (e: PointerEvent) => !userRef.current?.contains(e.target as Node) && setUserMenu(false);
    addEventListener("pointerdown", down);
    return () => removeEventListener("pointerdown", down);
  }, [userMenu]);

  // podpowiedź roli dla proxy (sesje sprzed tej zmiany) — raz po wejściu
  useEffect(() => {
    syncRole().catch(() => {});
  }, []);

  const circle = "grid size-11 place-items-center rounded-full border border-line-2 text-muted transition-colors duration-500 hover:border-white/30 hover:text-ink";

  return (
    <div className="relative min-h-[100svh]">
      {/* tło jak na stronie głównej: pionowe linie, poświata i przesuwająca się wiązka światła */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.035)_0_1px,transparent_1px_120px)] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="absolute -top-[25%] left-1/2 h-[70vh] w-[110vw] -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(139_108_255/0.16),transparent)]" />
        <div className="absolute top-0 bottom-0 w-[18vw] bg-[linear-gradient(90deg,transparent,rgb(180_162_255/0.07),transparent)] blur-2xl [animation:panel-beam_14s_ease-in-out_infinite]" />
      </div>

      {/* górny pasek — jak navbar strony */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease }}
        className={`sticky top-0 z-50 pt-[env(safe-area-inset-top)] transition-colors duration-500 ${scrolled ? "bg-bg lg:bg-bg/75 lg:backdrop-blur-xl" : "bg-bg lg:bg-transparent"}`}
      >
        <div className={`mx-auto flex h-[72px] max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-8 lg:h-20 lg:px-10 ${scrolled ? "border-b border-line lg:border-transparent" : ""}`}>
          <Link href={admin ? "/panel/admin" : "/panel"} className="group flex shrink-0 items-center gap-3" aria-label="Panel — start">
            <Mark className="size-8 transition-transform duration-700 ease-out-expo group-hover:-rotate-12" />
            <Wordmark className="hidden h-[20px] w-auto sm:block" />
          </Link>

          {/* sekcje */}
          {admin && (
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Sekcje">
              {main.map((x) => {
                const on = section.id === x.id;
                const badge = x.id === "klienci" ? inquiries : 0;
                return (
                  <Link key={x.id} href={x.links[0].href} className={`group relative rounded-full px-5 py-2.5 text-[15px] transition-colors ${on ? "text-ink" : "text-muted hover:text-ink"}`}>
                    {on && <motion.span layoutId="top-sec" className="absolute inset-0 rounded-full border border-line-2 bg-white/[0.05]" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                    <span className="roll relative">
                      <span>{x.label}</span>
                      <span aria-hidden>{x.label}</span>
                    </span>
                    {badge > 0 && <span className="absolute top-1 right-1.5 size-2 rounded-full bg-accent shadow-[0_0_10px_#8b6cff]" />}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {admin && soon && (
              <Link href="/panel/admin/tresci#soon" className="hidden items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/[0.07] px-3 py-1.5 text-[12px] text-amber-100 xl:flex">
                <span className="size-1.5 rounded-full bg-amber-300" /> Tryb zapowiedzi
              </Link>
            )}
            {admin && (
              <button type="button" onClick={() => setCmdk(true)} className={circle} aria-label="Szukaj (⌘K)" title="Szukaj (⌘K)">
                <Icon d={ICONS.search} className="size-[18px]" />
              </button>
            )}
            {admin && <Live />}
            {admin && <Bell notes={notes} />}
            {admin && (
              <Link href="/panel/admin/ustawienia" className={`${circle} hidden lg:grid ${section.id === "system" ? "border-accent/50 text-ink" : ""}`} aria-label="Ustawienia" title="Ustawienia">
                <Icon d={ICONS.gear} className="size-[18px]" />
              </Link>
            )}
            {admin && (
              <div className="relative hidden lg:block">
                <button type="button" data-create-trigger onClick={() => setCreate(create === "top" ? null : "top")} className="group btn btn-primary !h-11 !pl-5 text-[14px]">
                  <span className="roll">
                    <span>Nowe</span>
                    <span aria-hidden>Nowe</span>
                  </span>
                  <span className="dot !size-8">
                    <Icon d={ICONS.plus} className={`size-4 transition-transform duration-300 ${create === "top" ? "rotate-45" : ""}`} />
                  </span>
                </button>
                <div className="absolute top-full right-0">
                  <CreateMenu open={create === "top"} onClose={closeCreate} align="right" />
                </div>
              </div>
            )}
            <div className="relative hidden lg:block" ref={userRef}>
              <button type="button" onClick={() => setUserMenu((o) => !o)} className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-[14px] font-medium text-white shadow-[0_0_24px_-6px_rgb(139_108_255/0.9)]" aria-label="Konto">
                {user.name.charAt(0).toUpperCase()}
              </button>
              <AnimatePresence>
                {userMenu && (
                  <motion.div
                    className="edge absolute top-[calc(100%+10px)] right-0 z-[80] w-[240px] overflow-hidden rounded-2xl bg-surface p-1.5 shadow-[0_30px_70px_-20px_rgb(0_0_0/0.9)]"
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.2, ease }}
                  >
                    <div className="border-b border-line px-3 pt-2 pb-2.5">
                      <p className="truncate text-[13.5px]">{user.name}</p>
                      <p className="truncate text-[12px] text-dim">{user.email}</p>
                    </div>
                    {admin && (
                      <Link href="/panel/admin/logi" className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] text-muted hover:bg-white/[0.05] hover:text-ink">
                        <Icon d={ICONS.logs} className="size-4" /> Logi
                      </Link>
                    )}
                    <a href="/" target="_blank" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] text-muted hover:bg-white/[0.05] hover:text-ink">
                      <Icon d={ICONS.site} className="size-4" /> Otwórz stronę
                    </a>
                    <form action={logout}>
                      <button type="submit" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] text-muted hover:bg-red-400/10 hover:text-red-200">
                        <Icon d={ICONS.logout} className="size-4" /> Wyloguj
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button type="button" onClick={() => setMenu((o) => !o)} className="relative grid size-11 place-items-center rounded-full border border-line-2 lg:hidden" aria-label={menu ? "Zamknij menu" : "Menu"}>
              <span className={`absolute h-px w-4 bg-ink transition-transform duration-500 ease-out-expo ${menu ? "rotate-45" : "-translate-y-[3px]"}`} />
              <span className={`absolute h-px w-4 bg-ink transition-transform duration-500 ease-out-expo ${menu ? "-rotate-45" : "translate-y-[3px]"}`} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* menu pełnoekranowe (telefon/tablet) — jak na stronie */}
      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-40 bg-bg lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { delay: 0.1 } }}>
            <div className="flex h-full flex-col overflow-y-auto px-5 pt-[calc(env(safe-area-inset-top)+96px)] pb-[calc(env(safe-area-inset-bottom)+28px)]" data-lenis-prevent>
              <ul>
                {sections.map((x, i) => (
                  <li key={x.id} className="border-b border-line py-3">
                    <div className="overflow-hidden">
                      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ delay: 0.04 + i * 0.05, duration: 0.7, ease }}>
                        <Link href={x.links[0].href} className="h-display flex items-baseline justify-between text-[2.4rem]">
                          {x.label}
                          <span className="text-[13px] tracking-normal text-dim">0{i + 1}</span>
                        </Link>
                      </motion.div>
                    </div>
                    {x.links.length > 1 && (
                      <motion.div className="mt-2 flex flex-wrap gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.05 }}>
                        {x.links.map((l) => (
                          <Link key={l.href} href={l.href} className={`rounded-full border px-3 py-1.5 text-[13px] ${current?.href === l.href ? "border-accent/40 bg-accent/10 text-ink" : "border-line-2 text-muted"}`}>
                            {l.label}
                            {(l.badge ?? 0) > 0 && <span className="ml-1.5 text-accent-2">{l.badge}</span>}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-auto space-y-3 pt-8">
                <div className="edge flex items-center gap-3 rounded-2xl bg-white/[0.02] p-3">
                  <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-[14px] font-medium text-white">{user.name.charAt(0).toUpperCase()}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px]">{user.name}</span>
                    <span className="block truncate text-[12px] text-dim">{user.email}</span>
                  </span>
                  <form action={logout}>
                    <button type="submit" className="grid size-9 place-items-center rounded-full text-dim hover:text-ink" aria-label="Wyloguj">
                      <Icon d={ICONS.logout} className="size-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className={`relative mx-auto max-w-[1400px] px-4 pt-4 pb-16 sm:px-8 lg:px-10 lg:pt-6 ${admin ? "pb-[calc(env(safe-area-inset-bottom)+112px)] lg:pb-20" : ""}`}>
        {/* zakładki podstron sekcji */}
        {section.links.length > 1 && (
          <motion.nav initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="-mx-4 mb-6 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0" aria-label={section.label} data-lenis-prevent>
            <div className="inline-flex gap-1 rounded-full border border-line p-1">
              {section.links.map((l) => {
                const on = current?.href === l.href;
                return (
                  <Link key={l.href} href={l.href} className={`relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[14px] whitespace-nowrap transition-colors ${on ? "text-bg" : "text-muted hover:text-ink"}`}>
                    {on && <motion.span layoutId="sub-tab" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                    <span className="relative">
                      <Icon d={l.icon} className="size-4" />
                    </span>
                    <span className="relative">{l.label}</span>
                    {(l.badge ?? 0) > 0 && <span className={`relative grid min-w-[18px] place-items-center rounded-full px-1 text-[10.5px] font-medium ${on ? "bg-accent text-white" : "bg-accent/80 text-white"}`}>{l.badge}</span>}
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        )}
        {children}
      </main>

      {/* dok na telefonie (admin) */}
      {admin && !menu && (
        <nav className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+10px)] z-[60] rounded-[26px] border border-white/[0.08] bg-[rgb(14_14_19/0.92)] p-1.5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.95)] backdrop-blur-2xl lg:hidden" aria-label="Szybka nawigacja">
          <ul className="grid grid-cols-5 items-center">
            {[main[0], main[1], null, main[2], main[3]].map((x, i) =>
              x ? (
                <li key={x.id}>
                  <Link href={x.links[0].href} className={`relative flex flex-col items-center gap-0.5 rounded-[20px] py-2 text-[10.5px] transition-colors ${section.id === x.id ? "text-ink" : "text-dim"}`}>
                    {section.id === x.id && <motion.span layoutId="dock-hl" className="absolute inset-0 rounded-[20px] bg-white/[0.07] ring-1 ring-line-2" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                    <span className="relative">
                      <Icon d={x.icon} className="size-[21px]" />
                      {x.id === "klienci" && inquiries > 0 && <span className="absolute -top-1.5 -right-2.5 grid min-w-[16px] place-items-center rounded-full bg-accent px-1 text-[9.5px] font-medium text-white">{inquiries}</span>}
                    </span>
                    <span className="relative">{x.label}</span>
                  </Link>
                </li>
              ) : (
                <li key={`c${i}`} className="relative flex justify-center">
                  <button type="button" data-create-trigger onClick={() => setCreate(create === "tab" ? null : "tab")} className="grid size-[52px] place-items-center rounded-full bg-ink text-bg transition-transform active:scale-95" aria-label="Nowe">
                    <span className="grid size-9 place-items-center rounded-full bg-accent text-white">
                      <Icon d={ICONS.plus} className={`size-5 transition-transform duration-300 ${create === "tab" ? "rotate-45" : ""}`} />
                    </span>
                  </button>
                  <CreateMenu open={create === "tab"} onClose={closeCreate} align="up" />
                </li>
              ),
            )}
          </ul>
        </nav>
      )}
      {admin && <CommandPalette open={cmdk} onClose={() => setCmdk(false)} />}
    </div>
  );
}
