import { site } from "@/lib/site";

export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <span className={`relative grid place-items-center rounded-[10px] bg-gradient-to-b from-[#1c1c21] to-[#0e0e11] shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_0_0_1px_rgb(255_255_255/0.08)] ${className}`}>
      <svg viewBox="0 0 16 16" className="size-[55%] transition-transform duration-700 ease-out-expo group-hover:rotate-90" aria-hidden>
        <circle cx="4.5" cy="4.5" r="3" fill="var(--color-fig-coral)" />
        <rect x="8.5" y="1.5" width="6" height="6" rx="1.7" fill="var(--color-fig-purple)" />
        <rect x="1.5" y="8.5" width="6" height="6" rx="3" fill="var(--color-fig-blue)" />
        <path d="M11.5 8.5l3 6h-6z" fill="var(--color-fig-green)" />
      </svg>
    </span>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  const [name, tld] = site.domain.split(".");
  return (
    <span className={`font-display font-medium tracking-[-0.03em] ${className}`}>
      {name}
      <span className="text-muted">.{tld}</span>
    </span>
  );
}
