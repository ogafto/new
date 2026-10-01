"use client";

import Link from "next/link";
import { ICONS, Icon } from "./kit";

const items = [
  { href: "/panel/admin/klienci?zapros=1", label: "Zaproś klienta", icon: ICONS.users },
  { href: "/panel/admin/kalendarz?nowe=1", label: "Nowe zlecenie", icon: ICONS.calendar },
  { href: "/panel/admin/portfolio/nowy", label: "Dodaj projekt", icon: ICONS.plus },
];

export default function QuickActions() {
  return (
    <>
      {items.map((it, i) => (
        <Link
          key={it.href}
          href={it.href}
          className={`group inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13.5px] font-medium transition-colors duration-300 ${i === 0 ? "bg-ink text-bg hover:bg-white" : "border border-line-2 text-ink hover:border-white/35"}`}
        >
          <Icon d={it.icon} className="size-4 transition-transform duration-500 ease-out-expo group-hover:scale-110" />
          {it.label}
        </Link>
      ))}
    </>
  );
}
