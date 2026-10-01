import { marquee } from "@/lib/site";

const dots = ["bg-fig-red", "bg-fig-purple", "bg-fig-blue", "bg-fig-green", "bg-fig-yellow"];

export default function Marquee() {
  const items = [...marquee, ...marquee];
  return (
    <div className="relative -rotate-2 border-y border-line bg-panel py-4 sm:py-5" aria-label="Najważniejsze cechy oferty">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-panel to-transparent sm:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-panel to-transparent sm:w-32" />
      <div className="flex overflow-hidden">
        <ul className="flex shrink-0 animate-marquee items-center gap-8 pr-8 sm:gap-12 sm:pr-12">
          {items.map((m, i) => (
            <li key={i} className="flex items-center gap-8 whitespace-nowrap sm:gap-12" aria-hidden={i >= marquee.length}>
              <span className="font-display text-2xl font-semibold tracking-tight sm:text-4xl">{m}</span>
              <span className={`size-3 rotate-45 rounded-[3px] ${dots[i % dots.length]}`} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
