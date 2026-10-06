"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { logout } from "@/app/konto/actions";
import type { PulseEvent } from "@/app/api/panel/pulse/route";
import { takeInquiry } from "@/app/panel/admin/zapytania/actions";
import { syncRole } from "@/app/panel/actions";
import { Mark, Wordmark } from "../brand/Logo";
import { ease, Icon, ICONS } from "./kit";
import CommandPalette, { useCommandPalette } from "./CommandPalette";

export type Note = { id: string; kind: "deadline" | "inquiry"; title: string; text: string; href: string; urgent: boolean };
type Props = { user: { name: string; email: string }; admin: boolean; notes: Note[]; counts: { inquiries: number }; sites: { id: string; name: string }[]; children: React.ReactNode };

// Puls panelu: licznik „na stronie” + powiadomienia o wpłatach, zapytaniach i zamówieniach na żywo (bez przeładowania)
function Live() {
  const router = useRouter();
  const [n, setN] = useState<number | null>(null);
  const [toasts, setToasts] = useState<PulseEvent[]>([]);
  const [orders, setOrders] = useState<PulseEvent[]>([]);
  // powiadomienia przez portal — nagłówek ma backdrop-filter, który „łapie” elementy fixed
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    let alive = true;
    let busy = false;
    // pierwsze sprawdzenie łapie też zamówienia z ostatnich 10 min (np. świeżo po zalogowaniu)
    let since = Date.now() - 10 * 60_000;
    const seen = new Set<string>();
    const tick = async () => {
      if (document.hidden || busy) return;
      busy = true;
      try {
        const r = (await fetch(`/api/panel/pulse?since=${since}`, { cache: "no-store" }).then((x) => (x.ok ? x.json() : null))) as { live: number; now: number; events: PulseEvent[] } | null;
        if (!alive || !r) return;
        setN(r.live);
        const fresh = r.events.filter((e) => !seen.has(e.id));
        if (fresh.length) {
          fresh.forEach((e) => seen.add(e.id));
          const big = fresh.filter((e) => e.kind === "order");
          if (big.length) setOrders((o) => [...big, ...o].slice(0, 3));
          const small = fresh.filter((e) => e.kind !== "order" && e.ts > Date.now() - 2 * 60_000);
          if (small.length) setToasts((t) => [...small, ...t].slice(0, 4));
          router.refresh(); // kokpit, finanse i zapytania od razu pokazują nowe dane
        }
        since = Math.max(since, r.now - 60_000);
      } catch {
      } finally {
        busy = false;
      }
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
  // tytuł karty przeglądarki mruga, dopóki zamówienie czeka
  useEffect(() => {
    if (!orders.length) return;
    const base = document.title.replace(/^\(\d+\) /, "");
    let on = false;
    const t = setInterval(() => {
      on = !on;
      document.title = on ? `(${orders.length}) Nowe zamówienie` : base;
    }, 1200);
    return () => {
      clearInterval(t);
      document.title = base;
    };
  }, [orders.length]);
  const dismiss = useCallback((id: string) => setOrders((o) => o.filter((x) => x.id !== id)), []);

  return (
    <>
      <Link
        href="/panel/admin/analityka"
        className="flex h-10 items-center gap-2 rounded-full bg-white/[0.05] px-3.5 text-[13px] text-muted transition-colors hover:text-ink lg:h-11 lg:bg-surface lg:ring-1 lg:ring-white/[0.04] lg:ring-inset"
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
          <>
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
                      className={`relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-white/[0.08] bg-surface p-4 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.9)] ${e.kind === "payment" ? "ring-1 ring-emerald-400/30" : "ring-1 ring-accent/30"}`}
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
            </div>
            <div className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+76px)] z-[95] flex flex-col items-center gap-3 sm:inset-x-auto sm:right-6 sm:top-24 sm:w-[400px]">
              <AnimatePresence initial={false}>
                {orders.map((e) => (
                  <IncomingOrder key={e.id} e={e} onClose={() => dismiss(e.id)} />
                ))}
              </AnimatePresence>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

// Duża karta „Nowe zamówienie” — zostaje, aż ją obsłużysz: zajmij się, przyjmij z terminem albo zamknij
function IncomingOrder({ e, onClose }: { e: PulseEvent; onClose: () => void }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "taken">("idle");
  const open = (accept: boolean) => {
    onClose();
    router.push(`/panel/admin/zapytania?id=${e.iid}${accept ? "&przyjmij=1" : ""}`);
  };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.94, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="pointer-events-auto relative w-full overflow-hidden rounded-[26px] border border-accent/30 bg-[linear-gradient(180deg,rgb(30_26_52/0.98),rgb(14_13_22/0.98))] p-5 shadow-[0_40px_90px_-30px_rgb(0_0_0/0.95),0_0_80px_-30px_rgb(139_108_255/0.8)]"
      role="alertdialog"
      aria-label={e.title}
    >
      <div className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.4),transparent)]" aria-hidden />
      <span className="glow-edge [animation-duration:3.5s]" aria-hidden />
      <div className="relative flex items-start gap-3.5">
        <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-white shadow-[0_0_24px_-4px_rgb(139_108_255/0.9)]">
          <motion.span className="absolute inset-0 rounded-2xl border border-accent-2" animate={{ scale: [1, 1.5], opacity: [0.9, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
          <Icon d={ICONS.receipt} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11.5px] font-medium tracking-[0.14em] text-accent-2 uppercase">Nowe zamówienie z panelu</p>
          <p className="mt-1 truncate text-[17px] leading-snug">{e.title.replace(/^Nowe zamówienie: /, "")}</p>
          <p className="mt-0.5 text-[13.5px] text-muted">{e.text}</p>
          {e.meta && <p className="mt-0.5 text-[12.5px] text-dim">{e.meta}</p>}
        </div>
        <button type="button" onClick={onClose} className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-full text-dim transition-colors hover:bg-white/[0.06] hover:text-ink" aria-label="Zamknij">
          <Icon d={ICONS.close} className="size-4" />
        </button>
      </div>
      <div className="relative mt-4 grid grid-cols-2 gap-2">
        {state === "taken" ? (
          <button type="button" onClick={() => open(false)} className="flex h-11 items-center justify-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 text-[13.5px] text-emerald-200">
            <Icon d={ICONS.check} className="size-4" /> Zajmujesz się
          </button>
        ) : (
          <button
            type="button"
            disabled={state === "busy"}
            onClick={async () => {
              setState("busy");
              const r = await takeInquiry(e.iid!).catch(() => null);
              setState(r?.ok ? "taken" : "idle");
            }}
            className="h-11 rounded-full border border-line-2 text-[13.5px] transition-colors hover:border-white/35 hover:bg-white/[0.04] disabled:opacity-60"
          >
            {state === "busy" ? "Chwila…" : "Zajmę się tym"}
          </button>
        )}
        <button type="button" onClick={() => open(true)} className="group flex h-11 items-center justify-between rounded-full bg-ink pr-1.5 pl-4 text-[13.5px] font-medium text-bg transition-colors hover:bg-white">
          Przyjmij
          <span className="grid size-8 place-items-center rounded-full bg-accent text-white transition-transform duration-500 group-hover:rotate-45">
            <Icon d={ICONS.arrowUp} className="size-4 rotate-45" />
          </span>
        </button>
      </div>
      <button type="button" onClick={() => open(false)} className="relative mt-2.5 w-full text-center text-[12.5px] text-dim transition-colors hover:text-ink">
        Zobacz szczegóły
      </button>
    </motion.div>
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
        className="relative grid size-10 place-items-center rounded-full bg-white/[0.05] text-muted transition-colors hover:text-ink lg:size-11 lg:bg-surface lg:ring-1 lg:ring-white/[0.04] lg:ring-inset"
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
        { href: "/panel/admin/zlecenia", label: "Zlecenia", icon: ICONS.receipt },
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
        { href: "/panel/admin/strony", label: "Strony klientów", icon: ICONS.layers },
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

// rail = boczny pasek: na 1024–1279 px same ikony (wąska kolumna), od 1280 px pełne podpisy
function NavItem({ l, on, big = false, rail = false, layout }: { l: NavLink; on: boolean; big?: boolean; rail?: boolean; layout: string }) {
  return (
    <Link
      href={l.href}
      title={rail ? l.label : undefined}
      className={`group relative flex items-center gap-3 rounded-[14px] px-3 transition-colors duration-200 ${big ? "h-14 text-[17px]" : "h-10 text-[15px] [@media(max-height:920px)]:h-9 [@media(max-height:920px)]:text-[14.5px]"} ${rail ? "lg:max-xl:justify-center lg:max-xl:px-0" : ""} ${on ? "text-ink" : "text-muted hover:text-ink"}`}
    >
      {on && <motion.span layoutId={layout} className="absolute inset-0 rounded-[14px] bg-white/[0.07] ring-1 ring-white/[0.05] ring-inset" transition={{ type: "spring", stiffness: 500, damping: 42 }} />}
      {!on && <span className="absolute inset-0 rounded-[14px] bg-white/[0.035] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />}
      <span className="relative grid shrink-0 place-items-center">
        <Icon d={l.icon} className={`${big ? "size-5" : "size-[18px]"} ${on ? "text-ink" : ""}`} />
        {on && <span className="absolute -right-1 -bottom-0.5 size-1.5 rounded-full bg-accent shadow-[0_0_8px_rgb(139_108_255/0.9)]" />}
      </span>
      <span className={`relative min-w-0 flex-1 truncate ${rail ? "lg:max-xl:hidden" : ""}`}>{l.label}</span>
      {(l.badge ?? 0) > 0 && (
        <span
          className={`relative grid h-5 min-w-5 place-items-center rounded-full bg-accent/20 px-1.5 text-[11.5px] font-medium text-accent-2 ${rail ? "lg:max-xl:absolute lg:max-xl:top-0.5 lg:max-xl:right-2 lg:max-xl:h-4 lg:max-xl:min-w-4 lg:max-xl:bg-accent lg:max-xl:px-1 lg:max-xl:text-[9.5px] lg:max-xl:text-white" : ""}`}
        >
          {l.badge}
        </span>
      )}
    </Link>
  );
}

function Nav({ groups, current, big = false, rail = false, layout }: { groups: Group[]; current?: string; big?: boolean; rail?: boolean; layout: string }) {
  return (
    <div className={big ? "space-y-6" : "space-y-4 [@media(max-height:920px)]:space-y-2"}>
      {groups.map((g, gi) => (
        <div key={g.id}>
          {gi > 0 && <p className={`mb-1.5 px-3 text-[13.5px] text-dim [@media(max-height:920px)]:mb-0.5 [@media(max-height:920px)]:text-[12.5px] ${rail ? "lg:max-xl:hidden" : ""}`}>{g.label}</p>}
          {rail && gi > 0 && <span className="mx-auto mb-2 hidden h-px w-6 bg-line-2 lg:max-xl:block" />}
          <ul className="space-y-0.5">
            {g.links.map((l) => (
              <li key={l.href}>
                <NavItem l={l} on={current === l.href} big={big} rail={rail} layout={layout} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function UserRow({ user, admin, rail = false }: { user: Props["user"]; admin: boolean; rail?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${rail ? "lg:max-xl:flex-col lg:max-xl:gap-1.5" : ""}`}>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-[15px] font-medium text-white">{user.name.charAt(0).toUpperCase()}</span>
      <span className={`min-w-0 flex-1 ${rail ? "lg:max-xl:hidden" : ""}`}>
        <span className="block truncate text-[15px] leading-tight">{user.name}</span>
        <span className="mt-1 inline-block rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] text-muted">{admin ? "Administrator" : "Klient"}</span>
      </span>
      <form action={logout}>
        <button type="submit" className="grid size-9 place-items-center rounded-full text-dim transition-colors hover:bg-red-400/10 hover:text-red-200" aria-label="Wyloguj" title="Wyloguj">
          <Icon d={ICONS.logout} className="size-4" />
        </button>
      </form>
    </div>
  );
}

// karta na dole paska (jak „promo” we wzorze): stan strony i szybkie wyjście na nią / zamówienie usługi
function SideCard({ admin, soon }: { admin: boolean; soon: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-[linear-gradient(160deg,rgb(139_108_255/0.32),rgb(139_108_255/0.06)_55%,rgb(255_255_255/0.02))] p-4 ring-1 ring-white/[0.06] ring-inset">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.08)_1px,transparent_1.2px)] [mask-image:linear-gradient(to_top,black,transparent_60%)] bg-[size:6px_6px]" aria-hidden />
      <span className="relative grid size-10 place-items-center rounded-full bg-accent text-white shadow-[0_0_24px_-4px_rgb(139_108_255/0.9)]">
        <Icon d={admin ? ICONS.globe : ICONS.plus} className="size-5" />
      </span>
      {admin ? (
        <>
          <p className="relative mt-3 flex items-center gap-2 text-[16px] font-medium">
            <span className={`size-2 rounded-full ${soon ? "bg-amber-300" : "bg-emerald-400 shadow-[0_0_8px_#34d399]"}`} />
            {soon ? "Tryb zapowiedzi" : "Strona online"}
          </p>
          <p className="relative mt-1 text-[12.5px] leading-relaxed text-muted">{soon ? "Odwiedzający widzą zapowiedź. Zmienisz to w Treściach." : "afto.works działa i zbiera zapytania."}</p>
          <a href="/" target="_blank" className="relative mt-4 flex h-10 items-center justify-center gap-2 rounded-full bg-white/[0.08] text-[13.5px] ring-1 ring-white/[0.1] transition-colors ring-inset hover:bg-white/[0.14]">
            Otwórz stronę <Icon d="M5 12h14M13 6l6 6-6 6" className="size-4" />
          </a>
        </>
      ) : (
        <>
          <p className="relative mt-3 text-[16px] font-medium">Coś nowego?</p>
          <p className="relative mt-1 text-[12.5px] leading-relaxed text-muted">Strona, sklep, logo albo projekt UI. Zamów w minutę.</p>
          <Link href="/panel/zamow" className="relative mt-4 flex h-10 items-center justify-center gap-2 rounded-full bg-white/[0.08] text-[13.5px] ring-1 ring-white/[0.1] transition-colors ring-inset hover:bg-white/[0.14]">
            Zamów usługę <Icon d="M5 12h14M13 6l6 6-6 6" className="size-4" />
          </Link>
        </>
      )}
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
      {/* boczny pasek (komputer) — wypełniony panel przy krawędzi */}
      <aside className="fixed inset-y-3 left-3 z-40 hidden w-[76px] flex-col overflow-hidden rounded-[24px] bg-surface ring-1 ring-white/[0.04] ring-inset lg:flex xl:w-[264px]" aria-label="Nawigacja panelu">
        <div className="flex h-[76px] shrink-0 items-center justify-center px-5 xl:justify-start">
          <Link href={home} className="group flex items-center gap-2.5" aria-label="Panel — start">
            <Mark className="size-8 transition-transform duration-700 ease-out-expo group-hover:-rotate-12" />
            <Wordmark className="hidden h-[20px] w-auto xl:block" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:none]" data-lenis-prevent>
          <Nav groups={groups} current={current?.href} rail layout="side-hl" />
        </nav>

        <div className="hidden shrink-0 px-3 pb-3 xl:block [@media(max-height:1100px)]:hidden">
          <SideCard admin={admin} soon={soon} />
        </div>
        <div className="shrink-0 border-t border-line p-4 lg:max-xl:px-2">
          <UserRow user={user} admin={admin} rail />
        </div>
      </aside>

      <div className="relative lg:pl-[92px] xl:pl-[280px]">
        {/* górny pasek: tytuł strony + wyszukiwarka i szybkie akcje */}
        <header className={`sticky top-0 z-50 pt-[env(safe-area-inset-top)] transition-[border-color] duration-300 lg:static ${scrolled ? "border-b border-line bg-bg lg:border-transparent" : "border-b border-transparent bg-bg"}`}>
          <div className="mx-auto flex h-16 max-w-[1640px] items-center justify-between gap-3 px-4 sm:px-8 lg:h-[88px] lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Link href={home} className="shrink-0 lg:hidden" aria-label="Panel — start">
                <Mark className="size-8" />
              </Link>
              <h2 className="truncate text-[17px] font-medium tracking-[-0.02em] lg:text-[28px]">{current?.label ?? "Panel"}</h2>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {admin && soon && (
                <Link href="/panel/admin/tresci#soon" className="hidden h-11 items-center gap-2 rounded-full bg-amber-300/[0.08] px-4 text-[13px] text-amber-100 xl:flex">
                  <span className="size-1.5 rounded-full bg-amber-300" /> Tryb zapowiedzi
                </Link>
              )}
              {admin && (
                <>
                  <button type="button" onClick={() => setCmdk(true)} className="grid size-10 place-items-center rounded-full bg-white/[0.05] text-muted transition-colors hover:text-ink lg:hidden" aria-label="Szukaj">
                    <Icon d={ICONS.search} className="size-[18px]" />
                  </button>
                  <button type="button" onClick={() => setCmdk(true)} className="hidden h-11 w-[220px] items-center gap-2.5 rounded-full bg-surface pr-2 pl-4 text-[14px] whitespace-nowrap text-dim ring-1 ring-white/[0.04] transition-colors ring-inset hover:text-muted lg:flex xl:w-[320px]">
                    <Icon d={ICONS.search} className="size-[18px] shrink-0" />
                    <span className="truncate">
                      Szukaj<span className="hidden xl:inline"> klientów, płatności</span>…
                    </span>
                    <kbd className="ml-auto rounded-md bg-white/[0.06] px-1.5 py-0.5 font-sans text-[11px] text-muted">⌘K</kbd>
                  </button>
                </>
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

        <main className="relative mx-auto max-w-[1640px] px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+112px)] sm:px-8 lg:px-8 lg:pt-0 lg:pb-16">{children}</main>
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
              <div className="mt-8 space-y-4">
                <SideCard admin={admin} soon={soon} />
                <div className="rounded-[20px] bg-surface p-4">
                  <UserRow user={user} admin={admin} />
                </div>
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
