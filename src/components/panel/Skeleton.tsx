// Szkielet ładowania podstrony panelu — pokazuje się od razu po kliknięciu, zanim dojdą dane
export default function PanelSkeleton({ variant = "grid" }: { variant?: "grid" | "list" }) {
  return (
    <div aria-busy="true" aria-label="Ładowanie" className="animate-[fade-in_0.3s_ease-out]">
      <div className="mb-8 lg:mb-10">
        <div className="skeleton h-3.5 w-20 rounded-full" />
        <div className="skeleton mt-4 h-10 w-[min(320px,70%)] rounded-xl" />
      </div>
      {variant === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="skeleton col-span-2 h-[300px] rounded-[22px] lg:row-span-2 lg:h-auto" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-[140px] rounded-[22px]" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      ) : null}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="skeleton h-[260px] rounded-[22px]" />
        <div className="skeleton h-[260px] rounded-[22px]" style={{ animationDelay: "120ms" }} />
      </div>
      {variant === "list" && (
        <div className="mt-4 space-y-2.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-[72px] rounded-2xl" style={{ animationDelay: `${i * 70}ms` }} />
          ))}
        </div>
      )}
    </div>
  );
}
