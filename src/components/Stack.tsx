import { stack } from "@/lib/site";

export default function Stack() {
  const items = [...stack, ...stack];
  return (
    <div className="relative mx-auto mt-20 max-w-6xl px-5 pb-8 sm:mt-28">
      <p className="mb-7 text-center font-mono text-[11px] tracking-wide text-dim uppercase">Narzędzia, z którymi pracuję</p>
      <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_15%,#000_85%,transparent)]">
        <ul className="flex shrink-0 animate-marquee items-center">
          {items.map((s, i) => (
            <li
              key={i}
              aria-hidden={i >= stack.length}
              className="flex items-center gap-12 pr-12 font-display text-2xl font-medium tracking-[-0.04em] whitespace-nowrap text-white/35 transition-colors hover:text-white sm:text-3xl"
            >
              {s}
              <span className="size-1 rounded-full bg-white/20" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
