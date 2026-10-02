"use client";

import Link from "next/link";
import { ICONS, Icon } from "./kit";

const items = [
  { href: "/panel/admin/klienci?zapros=1", label: "Zaproś klienta", icon: ICONS.users },
  { href: "/panel/admin/kalendarz?nowe=1", label: "Nowe zlecenie", icon: ICONS.calendar },
  { href: "/panel/admin/finanse", label: "Płatność", icon: ICONS.wallet },
  { href: "/panel/admin/portfolio/nowy", label: "Dodaj projekt", icon: ICONS.plus },
];

export default function QuickActions() {
  return (
    <div className="-mx-5 flex w-[calc(100%+2.5rem)] min-w-0 gap-2 overflow-x-auto px-5 pb-1 sm:w-auto [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0" data-lenis-prevent>
      {items.map((it, i) => (
        <Link
          key={it.href}
          href={it.href}
          className={`group inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13.5px] font-medium transition-colors duration-300 ${i === 0 ? "bg-ink text-bg hover:bg-white" : "border border-line-2 text-ink hover:border-white/35"}`}
        >
          <Icon d={it.icon} className="size-4 transition-transform duration-500 ease-out-expo group-hover:scale-110" />
          {it.label}
        </Link>
      ))}
    </div>
  );
}
