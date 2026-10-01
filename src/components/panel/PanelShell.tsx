"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { logout } from "@/app/konto/actions";
import { Mark, Wordmark } from "../brand/Logo";

type U = { name: string; email: string; role: "client" | "admin" };

const icons = {
  home: "M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z",
  users: "M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 10a3 3 0 100-6 3 3 0 000 6zM21 19v-1a4 4 0 00-3-3.87M15.5 4.13a3 3 0 010 5.74",
  mail: "M3 6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v11a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5zM3.5 6l8.5 7 8.5-7",
  site: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5",
};

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export default function PanelShell({ user, children }: { user: U; children: React.ReactNode }) {
  const path = usePathname();
  const links =
    user.role === "admin"
      ? [
          { href: "/panel/admin", label: "Klienci i zaproszenia", icon: icons.users },
          { href: "/panel/admin/maile", label: "Szablony maili", icon: icons.mail },
        ]
      : [{ href: "/panel", label: "Przegląd", icon: icons.home }];

  return (
    <div className="min-h-[100svh] lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-line bg-bg/80 px-5 py-4 backdrop-blur-xl lg:h-[100svh] lg:flex-col lg:items-stretch lg:justify-start lg:border-r lg:border-b-0 lg:p-6">
        <Link href="/" className="flex items-center gap-3" aria-label="afto.works — strona główna">
          <Mark className="size-8" />
          <Wordmark className="hidden h-[19px] w-auto sm:block" />
        </Link>

        <nav className="flex gap-1 lg:mt-12 lg:flex-col" aria-label="Panel">
          <p className="mb-3 hidden px-3 text-[12px] text-dim lg:block">{user.role === "admin" ? "Administrator" : "Panel klienta"}</p>
          {links.map((l) => {
            const on = path === l.href;
            return (
              <Link key={l.href} href={l.href} className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors ${on ? "text-ink" : "text-muted hover:text-ink"}`}>
                {on && <motion.span layoutId="panel-nav" className="absolute inset-0 rounded-xl border border-line-2 bg-white/[0.04]" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                <span className="relative">
                  <Icon d={l.icon} />
                </span>
                <span className="relative hidden sm:inline">{l.label}</span>
              </Link>
            );
          })}
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-muted transition-colors hover:text-ink">
            <Icon d={icons.site} />
            <span className="hidden sm:inline">Strona</span>
          </Link>
        </nav>

        <div className="hidden lg:mt-auto lg:block">
          <div className="edge rounded-2xl bg-surface p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/20 text-[14px] font-medium text-accent-2">{user.name.charAt(0).toUpperCase()}</span>
              <span className="min-w-0">
                <span className="block truncate text-[14px]">{user.name}</span>
                <span className="block truncate text-[12px] text-dim">{user.email}</span>
              </span>
            </div>
            <form action={logout} className="mt-4">
              <button type="submit" className="w-full rounded-xl border border-line-2 py-2 text-[13px] text-muted transition-colors hover:border-white/30 hover:text-ink">
                Wyloguj
              </button>
            </form>
          </div>
        </div>
        <form action={logout} className="lg:hidden">
          <button type="submit" className="rounded-full border border-line-2 px-4 py-2 text-[13px] text-muted">
            Wyloguj
          </button>
        </form>
      </aside>

      <main className="relative min-w-0 px-5 py-10 sm:px-10 lg:py-14">
        <div className="pointer-events-none absolute top-0 right-0 size-[520px] rounded-full bg-[radial-gradient(closest-side,rgb(139_108_255/0.1),transparent)]" aria-hidden />
        <div className="relative mx-auto max-w-[1100px]">{children}</div>
      </main>
    </div>
  );
}
