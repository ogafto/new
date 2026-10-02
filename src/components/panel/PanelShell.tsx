"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { logout } from "@/app/konto/actions";
import { liveCount } from "@/app/panel/admin/actions";
import { Mark, Wordmark } from "../brand/Logo";
import { ease, Icon, ICONS } from "./kit";

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
          { href: "/panel/admin/klienci", label: "Klienci i zaproszenia", icon: ICONS.users },
          { href: "/panel/admin/strony", label: "Strony klientów", icon: ICONS.layers },
        ],
      },
      {
        group: "Treści",
        links: [
          { href: "/panel/admin/portfolio", label: "Portfolio", icon: ICONS.grid },
          { href: "/panel/admin/marka", label: "Marka i logo", icon: ICONS.brand },
        ],
      },
    ];
  return [
    {
      group: "Twój panel",
      links: [
        { href: "/panel", label: "Przegląd", icon: ICONS.home },
        ...sites.map((s) => ({ href: `/panel/strona/${s.id}`, label: s.name, icon: ICONS.layers })),
      ],
    },
  ];
}

function Live() {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    const tick = () =>
      liveCount()
        .then((v) => alive && setN(v))
        .catch(() => {});
    tick();
    const t = setInterval(tick, 20000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  return (
    <Link href="/panel/admin/analityka" className="flex items-center gap-2 rounded-full border border-line-2 px-3 py-1.5 text-[12.5px] text-muted transition-colors hover:text-ink" title="Osoby na stronie w ostatnich 5 minutach">
      <span className="relative flex size-2">
        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
        <span className="relative size-2 rounded-full bg-emerald-400" />
      </span>
      <span className="tabular-nums">{n ?? "–"}</span>
      <span className="hidden sm:inline">na stronie</span>
    </Link>
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
      <button type="button" onClick={() => setOpen((o) => !o)} className="relative grid size-10 place-items-center rounded-full border border-line-2 text-muted transition-colors hover:text-ink" aria-label={`Powiadomienia (${notes.length})`}>
        <motion.span animate={notes.length ? { rotate: [0, -14, 12, -8, 0] } : {}} transition={{ delay: 1, duration: 0.8 }}>
          <Icon d={ICONS.bell} className="size-[18px]" />
        </motion.span>
        {notes.length > 0 && <span className={`absolute -top-0.5 -right-0.5 grid min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-medium text-white ${urgent ? "bg-red-500" : "bg-accent"}`}>{notes.length}</span>}
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

export default function PanelShell({ user, admin, notes, counts, sites, children }: Props) {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const nav = navFor(admin, counts, sites);
  const active = (href: string) => (href === "/panel/admin" || href === "/panel" ? path === href : path.startsWith(href));

  useEffect(() => {
    const t = setTimeout(() => setMenu(false), 0);
    return () => clearTimeout(t);
  }, [path]);

  const side = (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex items-center gap-3 px-2" aria-label="afto.works — strona główna">
        <Mark className="size-8" />
        <Wordmark className="h-[19px] w-auto" />
      </Link>
      <nav className="mt-10 flex-1 space-y-7 overflow-y-auto" aria-label="Panel" data-lenis-prevent>
        {nav.map((g, gi) => (
          <motion.div key={g.group} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + gi * 0.08, duration: 0.7, ease }}>
            <p className="mb-2 px-3 text-[12px] text-dim">{g.group}</p>
            <ul className="space-y-0.5">
              {g.links.map((l) => {
                const on = active(l.href);
                const badge = "badge" in l ? (l.badge as number) : 0;
                return (
                  <li key={l.href}>
                    <Link href={l.href} className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors ${on ? "text-ink" : "text-muted hover:text-ink"}`}>
                      {on && (
                        <motion.span layoutId="panel-nav" className="absolute inset-0 rounded-xl border border-line-2 bg-white/[0.045]" transition={{ type: "spring", stiffness: 420, damping: 36 }}>
                          <span className="absolute top-1/2 -left-[13px] h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent shadow-[0_0_12px_#8b6cff]" />
                        </motion.span>
                      )}
                      <span className={`relative transition-colors ${on ? "text-accent-2" : ""}`}>
                        <Icon d={l.icon} />
                      </span>
                      <span className="relative flex-1 truncate">{l.label}</span>
                      {badge > 0 && <span className="relative grid min-w-[20px] place-items-center rounded-full bg-accent px-1.5 text-[11px] font-medium text-white">{badge}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        ))}
      </nav>
      <div className="mt-6 space-y-2">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] text-muted transition-colors hover:text-ink">
          <Icon d={ICONS.site} className="size-4" />
          Zobacz stronę
        </Link>
        <div className="edge flex items-center gap-3 rounded-2xl bg-white/[0.02] p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-[14px] font-medium text-white">{user.name.charAt(0).toUpperCase()}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px]">{user.name}</span>
            <span className="block truncate text-[11.5px] text-dim">{admin ? "Administrator" : user.email}</span>
          </span>
          <form action={logout}>
            <button type="submit" className="grid size-8 place-items-center rounded-full text-dim transition-colors hover:bg-white/5 hover:text-ink" aria-label="Wyloguj" title="Wyloguj">
              <Icon d={ICONS.logout} className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100svh] lg:grid lg:grid-cols-[264px_1fr]">
      <motion.aside
        className="sticky top-0 hidden h-[100svh] border-r border-line bg-bg/60 px-4 py-6 backdrop-blur-xl lg:block"
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, ease }}
      >
        {side}
      </motion.aside>

      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-[70] bg-bg lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <button
              type="button"
              onClick={() => setMenu(false)}
              className="absolute top-[calc(env(safe-area-inset-top)+20px)] right-5 z-10 grid size-10 place-items-center rounded-full border border-line-2"
              aria-label="Zamknij menu"
            >
              <Icon d={ICONS.close} className="size-4" />
            </button>
            <motion.aside
              className="absolute inset-0 overflow-y-auto px-5 pt-[calc(env(safe-area-inset-top)+24px)] pb-[calc(env(safe-area-inset-bottom)+24px)]"
              initial={{ y: 16 }}
              animate={{ y: 0 }}
              exit={{ y: 16 }}
              transition={{ duration: 0.5, ease }}
            >
              {side}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative min-w-0">
        <div className="pointer-events-none fixed top-0 right-0 size-[700px] rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.08),transparent)]" aria-hidden />
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8, ease }} className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-line bg-bg px-5 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 sm:px-8 lg:bg-bg/70 lg:pt-3 lg:backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setMenu(true)} className="grid size-10 place-items-center rounded-full border border-line-2 lg:hidden" aria-label="Menu">
              <Icon d={ICONS.menu} className="size-[18px]" />
            </button>
            <p className="hidden text-[13px] text-dim sm:block" suppressHydrationWarning>{new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p>
          </div>
          <div className="flex items-center gap-2">
            {admin && <Live />}
            {admin && <Bell notes={notes} />}
          </div>
        </motion.header>
        <main className="relative mx-auto max-w-[1240px] px-5 py-8 sm:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
