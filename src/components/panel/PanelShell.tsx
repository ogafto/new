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

/* ---------- nawigacja ---------- */

type NavLink = { href: string; label: string; icon: string; badge?: number };
type Group = { id: string; label: string; links: NavLink[] };

// wszystkie podstrony zawsze widoczne w bocznym pasku — pogrupowane, jedno kliknięcie do każdej
function groupsFor(admin: boolean, counts: Props["counts"], sites: Props["sites"]): Group[] {
  if (!admin)
    return [
      { id: "start", label: "Przegląd", links: [{ href: "/panel", label: "Kokpit", icon: ICONS.home }] },
      {
        id: "zamowienia",
        label: "Zamówienia",
        links: [
          { href: "/panel/zamowienia", label: "Moje zamówienia", icon: ICONS.receipt },
          { href: "/panel/zamow", label: "Zamów usługę", icon: ICONS.plus },
        ],
      },
      {
        id: "konto",
        label: "Konto",
        links: [
          { href: "/panel/platnosci", label: "Płatności", icon: ICONS.wallet },
          { href: "/panel/konto", label: "Ustawienia konta", icon: ICONS.key },
        ],
      },
      ...(sites.length ? [{ id: "strona", label: "Moja strona", links: sites.map((x) => ({ href: `/panel/strona/${x.id}`, label: x.name, icon: ICONS.layers })) }] : []),
    ];
  return [
    { id: "start", label: "Przegląd", links: [{ href: "/panel/admin", label: "Kokpit", icon: ICONS.home }] },
    {
      id: "klienci",
      label: "Klienci",
      links: [
        { href: "/panel/admin/zapytania", label: "Zapytania", icon: ICONS.inbox, badge: counts.inquiries },
        { href: "/panel/admin/klienci", label: "Klienci", icon: ICONS.users },
        { href: "/panel/admin/kalendarz", label: "Kalendarz", icon: ICONS.calendar },
      ],
    },
    {
      id: "biznes",
      label: "Biznes",
      links: [
        { href: "/panel/admin/finanse", label: "Finanse", icon: ICONS.wallet },
        { href: "/panel/admin/analityka", label: "Analityka", icon: ICONS.chart },
      ],
    },
    {
      id: "strona",
      label: "Strona",
      links: [
        { href: "/panel/admin/tresci", label: "Treści", icon: ICONS.doc },
        { href: "/panel/admin/portfolio", label: "Portfolio", icon: ICONS.grid },
        { href: "/panel/admin/marka", label: "Marka i logo", icon: ICONS.brand },
      ],
    },
    {
      id: "system",
      label: "System",
      links: [
        { href: "/panel/admin/ustawienia", label: "Ustawienia", icon: ICONS.gear },
        { href: "/panel/admin/logi", label: "Logi", icon: ICONS.logs },
      ],
    },
  ];
}

function NavItem({ l, on, big = false, layout }: { l: NavLink; on: boolean; big?: boolean; layout: string }) {
  return (
    <Link href={l.href} className={`group relative flex items-center gap-3 rounded-full px-2 transition-colors duration-300 ${big ? "h-14 text-[17px]" : "h-10 text-[14.5px]"} ${on ? "text-ink" : "text-muted hover:text-ink"}`}>
      {on && <motion.span layoutId={layout} className="absolute inset-0 rounded-full bg-white/[0.06] ring-1 ring-white/[0.08] ring-inset" transition={{ type: "spring", stiffness: 480, damping: 40 }} />}
      {!on && <span className="absolute inset-0 rounded-full bg-white/[0.035] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />}
      <span className={`relative grid shrink-0 place-items-center rounded-full transition-all duration-500 ${big ? "size-10" : "size-8"} ${on ? "bg-accent text-white shadow-[0_0_20px_-2px_rgb(139_108_255/0.85)]" : "text-dim group-hover:text-ink"}`}>
        <Icon d={l.icon} className={big ? "size-[18px]" : "size-[16px]"} />
      </span>
      <span className="roll relative min-w-0 flex-1 truncate">
        <span>{l.label}</span>
        <span aria-hidden>{l.label}</span>
      </span>
      {(l.badge ?? 0) > 0 && <span className="relative mr-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-medium text-white shadow-[0_0_12px_-2px_rgb(139_108_255/0.9)]">{l.badge}</span>}
    </Link>
  );
}

function Nav({ groups, current, big = false, layout }: { groups: Group[]; current?: string; big?: boolean; layout: string }) {
  return (
    <div className={big ? "space-y-7" : "space-y-4"}>
      {groups.map((g, gi) => (
        <motion.div key={g.id} initial={{ opacity: 0, x: big ? 0 : -8, y: big ? 12 : 0 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: 0.05 + gi * 0.05, duration: 0.6, ease }}>
          <p className="mb-1 px-3 text-[10.5px] font-medium tracking-[0.16em] text-dim uppercase">{g.label}</p>
          <ul className="space-y-0.5">
            {g.links.map((l) => (
              <li key={l.href}>
                <NavItem l={l} on={current === l.href} big={big} layout={layout} />
              </li>
            ))}
          </ul>
        </motion.div>
      ))}
    </div>
  );
}

function UserRow({ user }: { user: Props["user"] }) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-line bg-white/[0.02] p-1.5 pr-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-[14px] font-medium text-white shadow-[0_0_20px_-6px_rgb(139_108_255/0.9)]">{user.name.charAt(0).toUpperCase()}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] leading-tight">{user.name}</span>
        <span className="block truncate text-[11.5px] text-dim">{user.email}</span>
      </span>
      <a href="/" target="_blank" className="grid size-8 shrink-0 place-items-center rounded-full text-dim transition-colors hover:bg-white/[0.06] hover:text-ink" aria-label="Otwórz stronę" title="Otwórz stronę">
        <Icon d={ICONS.site} className="size-4" />
      </a>
      <form action={logout} className="-ml-2">
        <button type="submit" className="grid size-8 place-items-center rounded-full text-dim transition-colors hover:bg-red-400/10 hover:text-red-200" aria-label="Wyloguj" title="Wyloguj">
          <Icon d={ICONS.logout} className="size-4" />
        </button>
      </form>
    </div>
  );
}

function SiteStatus({ soon }: { soon: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-line bg-white/[0.02] p-1.5">
      <Link href="/panel/admin/tresci#soon" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/[0.04]">
        <span className="relative flex size-2">
          {!soon && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60" />}
          <span className={`relative size-2 rounded-full ${soon ? "bg-amber-300" : "bg-emerald-400"}`} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px]">{soon ? "Tryb zapowiedzi" : "Strona online"}</span>
          <span className="block truncate text-[11.5px] text-dim">afto.works</span>
        </span>
      </Link>
      <a href="/" target="_blank" className="grid size-9 shrink-0 place-items-center rounded-xl text-dim transition-colors hover:bg-white/[0.05] hover:text-ink" aria-label="Otwórz stronę" title="Otwórz stronę">
        <Icon d={ICONS.site} className="size-4" />
      </a>
    </div>
  );
}

function PrimaryLink({ href, children, icon = ICONS.plus }: { href: string; children: string; icon?: string }) {
  return (
    <Link href={href} className="group btn btn-primary !h-11 !gap-3 !pl-5 !pr-1.5 text-[14px]">
      <span className="roll">
        <span>{children}</span>
        <span aria-hidden>{children}</span>
      </span>
      <span className="dot !size-8">
        <Icon d={icon} className="size-4" />
      </span>
    </Link>
  );
}

export default function PanelShell({ user, admin, notes, counts, sites, soon = false, children }: Props & { soon?: boolean }) {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const [create, setCreate] = useState<"top" | "tab" | null>(null);
  const closeCreate = useCallback(() => setCreate(null), []);
  const [scrolled, setScrolled] = useState(false);
  const [cmdk, setCmdk] = useCommandPalette();

  const groups = groupsFor(admin, counts, sites);
  const links = groups.flatMap((g) => g.links);
  const home = admin ? "/panel/admin" : "/panel";
  const match = (href: string) => (href === home ? path === href : path === href || path.startsWith(href + "/"));
  const current = links.filter((l) => match(l.href)).sort((a, b) => b.href.length - a.href.length)[0];
  const group = groups.find((g) => g.links.some((l) => l.href === current?.href));

  useEffect(() => {
    const t = setTimeout(() => {
      setMenu(false);
      setCreate(null);
    }, 0);
    return () => clearTimeout(t);
  }, [path]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);

  // podpowiedź roli dla proxy (sesje sprzed tej zmiany) — raz po wejściu
  useEffect(() => {
    syncRole().catch(() => {});
  }, []);

  const dock: (NavLink | "plus" | "more")[] = admin
    ? [links[0], links[1], "plus", links.find((l) => l.href === "/panel/admin/finanse")!, "more"]
    : [links[0], links[1], "plus", links.find((l) => l.href === "/panel/platnosci")!, "more"];

  return (
    <div className="relative min-h-[100svh]">
      {/* tło: delikatna poświata i linie jak na stronie głównej, wygaszone ku dołowi */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.028)_0_1px,transparent_1px_120px)] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
        <div className="absolute -top-[30vh] right-[-10vw] h-[80vh] w-[70vw] bg-[radial-gradient(closest-side,rgb(139_108_255/0.13),transparent)]" />
        <div className="absolute bottom-[-30vh] left-[10vw] h-[60vh] w-[50vw] bg-[radial-gradient(closest-side,rgb(139_108_255/0.06),transparent)]" />
      </div>

      {/* boczny pasek (komputer) — pływająca szklana kolumna */}
      <motion.aside
        initial={{ x: -24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease }}
        className="fixed inset-y-3 left-3 z-40 hidden w-[256px] flex-col overflow-hidden rounded-[28px] border border-white/[0.07] bg-[linear-gradient(180deg,rgb(18_18_25/0.85),rgb(10_10_14/0.85))] shadow-[0_1px_0_0_rgb(255_255_255/0.05)_inset,0_30px_80px_-30px_rgb(0_0_0/0.9)] backdrop-blur-2xl lg:flex"
        aria-label="Nawigacja panelu"
      >
        <div className="pointer-events-none absolute -top-24 -left-20 size-64 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.22),transparent)]" aria-hidden />
        <div className="relative flex items-center justify-between px-5 pt-5">
          <Link href={home} className="group flex items-center gap-2.5" aria-label="Panel — start">
            <Mark className="size-8 transition-transform duration-700 ease-out-expo group-hover:-rotate-12" />
            <Wordmark className="h-[19px] w-auto" />
          </Link>
          <span className="rounded-full border border-line-2 px-2.5 py-0.5 text-[11px] text-muted">{admin ? "Studio" : "Klient"}</span>
        </div>

        {admin ? (
          <button type="button" onClick={() => setCmdk(true)} className="relative mx-3 mt-4 flex h-10 items-center gap-2.5 rounded-full border border-line bg-white/[0.025] px-4 text-[13.5px] text-dim transition-colors hover:border-line-2 hover:text-muted">
            <Icon d={ICONS.search} className="size-4" />
            Szukaj…
            <kbd className="ml-auto rounded-md border border-line-2 px-1.5 py-0.5 font-sans text-[11px] text-muted">⌘K</kbd>
          </button>
        ) : null}

        <nav className="relative mt-4 flex-1 overflow-y-auto px-3 pb-3 [scrollbar-width:none]" data-lenis-prevent>
          <Nav groups={groups} current={current?.href} layout="side-hl" />
        </nav>

        <div className="relative border-t border-line p-3">
          <UserRow user={user} />
        </div>
      </motion.aside>

      <div className="relative lg:pl-[272px]">
        {/* górny pasek: gdzie jestem + szybkie akcje */}
        <header className={`sticky top-0 z-50 pt-[env(safe-area-inset-top)] transition-[background-color,border-color] duration-500 ${scrolled ? "border-b border-line bg-bg lg:bg-bg/70 lg:backdrop-blur-xl" : "border-b border-transparent bg-bg lg:bg-transparent"}`}>
          <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-3 px-4 sm:px-8 lg:h-[76px] lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <Link href={home} className="shrink-0 lg:hidden" aria-label="Panel — start">
                <Mark className="size-8" />
              </Link>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p key={current?.href ?? path} className="flex min-w-0 items-center gap-2 text-[14px]" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease }}>
                  {group && group.links.length > 1 && (
                    <>
                      <span className="hidden text-dim sm:inline">{group.label}</span>
                      <span className="hidden text-line-2 sm:inline">/</span>
                    </>
                  )}
                  <span className="truncate text-ink">{current?.label ?? "Panel"}</span>
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {admin && soon && (
                <Link href="/panel/admin/tresci#soon" className="hidden items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/[0.07] px-3 py-1.5 text-[12px] text-amber-100 xl:flex">
                  <span className="size-1.5 rounded-full bg-amber-300" /> Tryb zapowiedzi
                </Link>
              )}
              {admin && (
                <button type="button" onClick={() => setCmdk(true)} className="grid size-10 place-items-center rounded-full border border-line-2 text-muted transition-colors hover:text-ink lg:hidden" aria-label="Szukaj">
                  <Icon d={ICONS.search} className="size-[18px]" />
                </button>
              )}
              {admin && <Live />}
              {admin && <Bell notes={notes} />}
              {admin ? (
                <div className="relative hidden lg:block">
                  <button type="button" data-create-trigger onClick={() => setCreate(create === "top" ? null : "top")} className="group btn btn-primary !h-11 !gap-3 !pl-5 !pr-1.5 text-[14px]">
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
              ) : (
                <>
                  {path !== "/panel/zamow" && (
                    <span className="hidden lg:block">
                      <PrimaryLink href="/panel/zamow">Zamów usługę</PrimaryLink>
                    </span>
                  )}
                  <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-[14px] font-medium text-white lg:hidden">{user.name.charAt(0).toUpperCase()}</span>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="relative mx-auto max-w-[1320px] px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+112px)] sm:px-8 lg:px-10 lg:pt-4 lg:pb-20">{children}</main>
      </div>

      {/* menu pełnoekranowe (telefon/tablet) */}
      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-[55] bg-bg lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="pointer-events-none absolute -top-32 -right-24 size-[420px] rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.18),transparent)]" aria-hidden />
            <div className="relative flex h-full flex-col overflow-y-auto px-4 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+108px)]" data-lenis-prevent>
              <div className="mb-6 flex items-center justify-between px-1">
                <span className="flex items-center gap-2.5">
                  <Mark className="size-8" />
                  <Wordmark className="h-[19px] w-auto" />
                </span>
                {admin && (
                  <button type="button" onClick={() => setCmdk(true)} className="flex h-10 items-center gap-2 rounded-full border border-line-2 px-4 text-[13.5px] text-muted">
                    <Icon d={ICONS.search} className="size-4" /> Szukaj
                  </button>
                )}
              </div>
              <Nav groups={groups} current={current?.href} big layout="sheet-hl" />
              <div className="mt-8 space-y-2">
                {admin && <SiteStatus soon={soon} />}
                <UserRow user={user} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* dok na telefonie */}
      <nav className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+10px)] z-[60] rounded-[26px] border border-white/[0.08] bg-[rgb(16_16_22/0.92)] p-1.5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.95)] backdrop-blur-2xl lg:hidden" aria-label="Szybka nawigacja">
        <ul className="grid grid-cols-5 items-center">
          {dock.map((x, i) =>
            x === "plus" ? (
              <li key="plus" className="relative flex justify-center">
                {admin ? (
                  <>
                    <button type="button" data-create-trigger onClick={() => setCreate(create === "tab" ? null : "tab")} className="grid size-[52px] place-items-center rounded-full bg-ink text-bg transition-transform active:scale-95" aria-label="Nowe">
                      <span className="grid size-9 place-items-center rounded-full bg-accent text-white">
                        <Icon d={ICONS.plus} className={`size-5 transition-transform duration-300 ${create === "tab" ? "rotate-45" : ""}`} />
                      </span>
                    </button>
                    <CreateMenu open={create === "tab"} onClose={closeCreate} align="up" />
                  </>
                ) : (
                  <Link href="/panel/zamow" className="grid size-[52px] place-items-center rounded-full bg-ink text-bg transition-transform active:scale-95" aria-label="Zamów usługę">
                    <span className="grid size-9 place-items-center rounded-full bg-accent text-white">
                      <Icon d={ICONS.plus} className="size-5" />
                    </span>
                  </Link>
                )}
              </li>
            ) : x === "more" ? (
              <li key="more">
                <button type="button" onClick={() => setMenu((o) => !o)} className={`relative flex w-full flex-col items-center gap-0.5 rounded-[20px] py-2 text-[10.5px] transition-colors ${menu ? "text-ink" : "text-dim"}`} aria-label={menu ? "Zamknij menu" : "Menu"}>
                  {menu && <motion.span layoutId="dock-hl" className="absolute inset-0 rounded-[20px] bg-white/[0.07] ring-1 ring-line-2" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                  <span className="relative grid size-[21px] place-items-center">
                    <span className={`absolute h-[1.5px] w-4 rounded bg-current transition-transform duration-500 ease-out-expo ${menu ? "rotate-45" : "-translate-y-[4px]"}`} />
                    <span className={`absolute h-[1.5px] w-4 rounded bg-current transition-opacity duration-300 ${menu ? "opacity-0" : ""}`} />
                    <span className={`absolute h-[1.5px] w-4 rounded bg-current transition-transform duration-500 ease-out-expo ${menu ? "-rotate-45" : "translate-y-[4px]"}`} />
                  </span>
                  <span className="relative">{menu ? "Zamknij" : "Menu"}</span>
                </button>
              </li>
            ) : (
              <li key={x.href + i}>
                <Link href={x.href} className={`relative flex flex-col items-center gap-0.5 rounded-[20px] py-2 text-[10.5px] transition-colors ${!menu && current?.href === x.href ? "text-ink" : "text-dim"}`}>
                  {!menu && current?.href === x.href && <motion.span layoutId="dock-hl" className="absolute inset-0 rounded-[20px] bg-white/[0.07] ring-1 ring-line-2" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                  <span className="relative">
                    <Icon d={x.icon} className="size-[21px]" />
                    {(x.badge ?? 0) > 0 && <span className="absolute -top-1.5 -right-2.5 grid min-w-[16px] place-items-center rounded-full bg-accent px-1 text-[9.5px] font-medium text-white">{x.badge}</span>}
                  </span>
                  <span className="relative max-w-full truncate px-1">{x.label === "Moje zamówienia" ? "Zamówienia" : x.label}</span>
                </Link>
              </li>
            ),
          )}
        </ul>
      </nav>
      {admin && <CommandPalette open={cmdk} onClose={() => setCmdk(false)} />}
    </div>
  );
}
