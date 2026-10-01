import type { Project } from "@/lib/site";
import MockSite from "../MockSite";

// Miniatura pracy: prawdziwy zrzut (jeśli jest `image`) albo makieta CSS.
// Po najechaniu na rodzica z klasą `group/mock` długi zrzut/makieta się przewija.
export default function ProjectThumb({ p, className = "" }: { p: Project; className?: string }) {
  return (
    <div className={`@container relative overflow-hidden bg-bg-2 ${className}`}>
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
