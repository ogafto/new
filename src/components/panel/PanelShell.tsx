"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { logout } from "@/app/konto/actions";
import { Mark, Wordmark } from "../brand/Logo";
import { Icon, ICONS } from "./kit";

type Props = { user: { name: string; email: string }; children: React.ReactNode };

// Licznik „na stronie” (osoby w ostatnich 5 minutach), odświeżany co 15 s
function Live() {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (document.hidden) return;
      const r = (await fetch("/api/panel/pulse", { cache: "no-store" })
        .then((x) => (x.ok ? x.json() : null))
        .catch(() => null)) as { live: number } | null;
      if (alive && r) setN(r.live);
    };
    tick();
    const t = setInterval(tick, 15000);
    const vis = () => !document.hidden && tick();
    document.addEventListener("visibilitychange", vis);
    return () => {
      alive = false;
      clearInterval(t);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);
  return (
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
  );
}

const LINKS = [
  { href: "/panel/admin/analityka", label: "Statystyki", icon: ICONS.chart },
  { href: "/panel/admin/portfolio", label: "Portfolio", icon: ICONS.grid },
];

function NavItem({ l, on, big = false, layout }: { l: (typeof LINKS)[number]; on: boolean; big?: boolean; layout: string }) {
  return (
    <Link
      href={l.href}
      title={l.label}
      className={`group relative flex items-center gap-3 rounded-[14px] px-3 transition-colors duration-200 ${big ? "h-14 text-[17px]" : "h-10 text-[15px] lg:max-xl:justify-center lg:max-xl:px-0"} ${on ? "text-ink" : "text-muted hover:text-ink"}`}
    >
      {on && <motion.span layoutId={layout} className="absolute inset-0 rounded-[14px] bg-white/[0.07] ring-1 ring-white/[0.05] ring-inset" transition={{ type: "spring", stiffness: 500, damping: 42 }} />}
      {!on && <span className="absolute inset-0 rounded-[14px] bg-white/[0.035] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />}
      <span className="relative grid shrink-0 place-items-center">
        <Icon d={l.icon} className={big ? "size-5" : "size-[18px]"} />
        {on && <span className="absolute -right-1 -bottom-0.5 size-1.5 rounded-full bg-accent shadow-[0_0_8px_rgb(139_108_255/0.9)]" />}
      </span>
      <span className={`relative min-w-0 flex-1 truncate ${big ? "" : "lg:max-xl:hidden"}`}>{l.label}</span>
    </Link>
  );
}

function UserRow({ user, rail = false }: { user: Props["user"]; rail?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${rail ? "lg:max-xl:flex-col lg:max-xl:gap-1.5" : ""}`}>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-[15px] font-medium text-white">{user.name.charAt(0).toUpperCase()}</span>
      <span className={`min-w-0 flex-1 ${rail ? "lg:max-xl:hidden" : ""}`}>
        <span className="block truncate text-[15px] leading-tight">{user.name}</span>
        <span className="mt-1 block truncate text-[12px] text-dim">{user.email}</span>
      </span>
      <form action={logout}>
        <button type="submit" className="grid size-9 place-items-center rounded-full text-dim transition-colors hover:bg-red-400/10 hover:text-red-200" aria-label="Wyloguj" title="Wyloguj">
          <Icon d={ICONS.logout} className="size-4" />
        </button>
      </form>
    </div>
  );
}

function SideCard() {
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-[linear-gradient(160deg,rgb(139_108_255/0.32),rgb(139_108_255/0.06)_55%,rgb(255_255_255/0.02))] p-4 ring-1 ring-white/[0.06] ring-inset">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.08)_1px,transparent_1.2px)] [mask-image:linear-gradient(to_top,black,transparent_60%)] bg-[size:6px_6px]" aria-hidden />
      <p className="relative flex items-center gap-2 text-[16px] font-medium">
        <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        Strona online
      </p>
      <p className="relative mt-1 text-[12.5px] leading-relaxed text-muted">Nowe kategorie lądują na początku strony, nowe zdjęcia na dole swojej kategorii.</p>
      <a href="/" target="_blank" className="relative mt-4 flex h-10 items-center justify-center gap-2 rounded-full bg-white/[0.08] text-[13.5px] ring-1 ring-white/[0.1] transition-colors ring-inset hover:bg-white/[0.14]">
        Otwórz stronę <Icon d="M5 12h14M13 6l6 6-6 6" className="size-4" />
      </a>
    </div>
  );
}

export default function PanelShell({ user, children }: Props) {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const current = LINKS.find((l) => path === l.href || path.startsWith(l.href + "/"));

  useEffect(() => {
    const t = setTimeout(() => setMenu(false), 0);
    return () => clearTimeout(t);
  }, [path]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);

  return (
    <div className="relative min-h-[100svh]">
      {/* boczny pasek (komputer) */}
      <aside className="fixed inset-y-3 left-3 z-40 hidden w-[76px] flex-col overflow-hidden rounded-[24px] bg-surface ring-1 ring-white/[0.04] ring-inset lg:flex xl:w-[264px]" aria-label="Nawigacja panelu">
        <div className="flex h-[76px] shrink-0 items-center justify-center px-5 xl:justify-start">
          <Link href="/panel/admin" className="group flex items-center gap-2.5" aria-label="Panel, start">
            <Mark className="size-8 transition-transform duration-700 ease-out-expo group-hover:-rotate-12" />
            <Wordmark className="hidden h-[20px] w-auto xl:block" />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:none]" data-lenis-prevent>
          <ul className="space-y-0.5">
            {LINKS.map((l) => (
              <li key={l.href}>
                <NavItem l={l} on={current?.href === l.href} layout="side-hl" />
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden shrink-0 px-3 pb-3 xl:block">
          <SideCard />
        </div>
        <div className="shrink-0 border-t border-line p-4 lg:max-xl:px-2">
          <UserRow user={user} rail />
        </div>
      </aside>

      <div className="relative lg:pl-[92px] xl:pl-[280px]">
        <header className={`sticky top-0 z-50 pt-[env(safe-area-inset-top)] transition-[border-color] duration-300 lg:static ${scrolled ? "border-b border-line bg-bg lg:border-transparent" : "border-b border-transparent bg-bg"}`}>
          <div className="mx-auto flex h-16 max-w-[1640px] items-center justify-between gap-3 px-4 sm:px-8 lg:h-[88px] lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/panel/admin" className="shrink-0 lg:hidden" aria-label="Panel, start">
                <Mark className="size-8" />
              </Link>
              <h2 className="truncate text-[17px] font-medium tracking-[-0.02em] lg:text-[28px]">{current?.label ?? "Panel"}</h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Live />
              <Link href="/panel/admin/portfolio" className="group btn btn-primary hidden !h-11 !gap-3 !pr-1.5 !pl-5 text-[14px] lg:inline-flex">
                <span className="roll">
                  <span>Dodaj prace</span>
                  <span aria-hidden>Dodaj prace</span>
                </span>
                <span className="dot !size-8">
                  <Icon d={ICONS.plus} className="size-4" />
                </span>
              </Link>
            </div>
          </div>
        </header>

        <main className="relative mx-auto max-w-[1640px] px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+112px)] sm:px-8 lg:px-8 lg:pt-0 lg:pb-16">{children}</main>
      </div>

      {/* menu (telefon/tablet) */}
      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-[55] bg-bg lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="pointer-events-none absolute -top-32 -right-24 size-[420px] rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.18),transparent)]" aria-hidden />
            <div className="relative flex h-full flex-col overflow-y-auto px-4 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+108px)]" data-lenis-prevent>
              <div className="mb-6 flex items-center gap-2.5 px-1">
                <Mark className="size-8" />
                <Wordmark className="h-[19px] w-auto" />
              </div>
              <ul className="space-y-0.5">
                {LINKS.map((l) => (
                  <li key={l.href}>
                    <NavItem l={l} on={current?.href === l.href} big layout="sheet-hl" />
                  </li>
                ))}
              </ul>
              <div className="mt-8 space-y-4">
                <SideCard />
                <div className="rounded-[20px] bg-surface p-4">
                  <UserRow user={user} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* dok na telefonie */}
      <nav className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+10px)] z-[60] rounded-[26px] border border-white/[0.08] bg-[rgb(16_16_22/0.92)] p-1.5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.95)] backdrop-blur-2xl lg:hidden" aria-label="Szybka nawigacja">
        <ul className="grid grid-cols-3 items-center">
          {LINKS.map((x) => (
            <li key={x.href}>
              <Link href={x.href} className={`relative flex flex-col items-center gap-0.5 rounded-[20px] py-2 text-[10.5px] transition-colors ${!menu && current?.href === x.href ? "text-ink" : "text-dim"}`}>
                {!menu && current?.href === x.href && <motion.span layoutId="dock-hl" className="absolute inset-0 rounded-[20px] bg-white/[0.07] ring-1 ring-line-2" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                <Icon d={x.icon} className="relative size-[21px]" />
                <span className="relative">{x.label}</span>
              </Link>
            </li>
          ))}
          <li>
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
        </ul>
      </nav>
    </div>
  );
}
