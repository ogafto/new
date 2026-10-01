"use client";

import Link from "next/link";
import ScrollLink from "../figma/ScrollLink";

type Variant = "primary" | "ghost" | "blue";
type Size = "sm" | "md" | "lg";

type Props = {
  children: string;
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  to?: string; // id sekcji na stronie głównej
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-[15px]",
};

const arrowSizes: Record<Size, string> = {
  sm: "pr-1 -mr-0.5",
  md: "pr-1.5",
  lg: "pr-2",
};

const iconBox: Record<Size, string> = {
  sm: "size-7",
  md: "size-8",
  lg: "size-10",
};

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className} aria-hidden>
      <path d="M3.5 10.5l7-7M5 3.5h5.5V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Inner({ children, variant, size, arrow }: Required<Pick<Props, "children" | "variant" | "size" | "arrow">>) {
  return (
    <>
      <span className="roll">
        <span>{children}</span>
        <span aria-hidden>{children}</span>
      </span>
      {arrow && (
        <span
          className={`arrow-swap ${iconBox[size]} ${
            variant === "primary" ? "bg-[#0a0a0b] text-white" : "bg-white/10 text-white"
          }`}
        >
          <Arrow />
          <Arrow />
        </span>
      )}
    </>
  );
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  arrow = false,
  to,
  href,
  type = "button",
  disabled,
  onClick,
  className = "",
}: Props) {
  const cls = `group btn btn-${variant} ${sizes[size]} ${arrow ? `${arrowSizes[size]} gap-3` : ""} ${
    disabled ? "pointer-events-none opacity-60" : ""
  } ${className}`;
  const inner = <Inner variant={variant} size={size} arrow={arrow}>{children}</Inner>;

  if (to)
    return (
      <ScrollLink to={to} className={cls} onClick={onClick}>
        {inner}
      </ScrollLink>
    );
  if (href)
    return href.startsWith("/") ? (
      <Link href={href} className={cls} onClick={onClick}>
        {inner}
      </Link>
    ) : (
      <a href={href} className={cls} onClick={onClick}>
        {inner}
      </a>
    );
  return (
    <button type={type} className={cls} disabled={disabled} onClick={onClick}>
      {inner}
    </button>
  );
}
