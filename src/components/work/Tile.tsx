import type { Project } from "@/lib/site";
import MockSite from "../MockSite";

// Zrzut / makieta projektu. Po najechaniu na rodzica `group/mock` długa strona się przewija.
export function ProjectThumb({ p, className = "" }: { p: Project; className?: string }) {
  return (
    <div className={`@container overflow-hidden ${className.includes("absolute") ? "" : "relative"} ${className}`}>
      {p.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.image}
          alt={`${p.name} — ${p.client}`}
          className="absolute inset-0 size-full object-cover object-top transition-[object-position] duration-[3s] ease-in-out group-hover/mock:object-bottom"
          loading="lazy"
        />
      ) : (
        <MockSite theme={p.theme} />
      )}
    </div>
  );
}

// Kafelek realizacji: kolorowe tło + okno projektu wychodzące od dołu
export default function Tile({ p, className = "", compact = false }: { p: Project; className?: string; compact?: boolean }) {
  return (
    <div className={`group/mock relative isolate overflow-hidden ${compact ? "rounded-[16px]" : "rounded-[24px]"} ${className}`} style={{ background: p.tile }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgb(255_255_255/0.14),transparent_60%)]" />
      <div
        className={`absolute inset-x-[7%] bottom-0 overflow-hidden bg-white shadow-[0_30px_70px_-20px_rgb(0_0_0/0.6)] transition-transform duration-700 ease-out-expo group-hover/tile:-translate-y-2 ${
          compact ? "top-[11%] rounded-t-[8px]" : "top-[9%] rounded-t-[12px]"
        }`}
      >
        <div className={`flex items-center gap-1 bg-black/[0.06] px-2.5 ${compact ? "h-3" : "h-5"}`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={`rounded-full bg-black/15 ${compact ? "size-1" : "size-1.5"}`} />
          ))}
        </div>
        <ProjectThumb p={p} className={`absolute inset-x-0 bottom-0 ${compact ? "top-3" : "top-5"}`} />
      </div>
    </div>
  );
}
