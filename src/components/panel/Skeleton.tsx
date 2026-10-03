// Szkielet ładowania podstrony panelu — pokazuje się od razu po kliknięciu, zanim dojdą dane
export default function PanelSkeleton({ variant = "grid" }: { variant?: "grid" | "list" }) {
  return (
    <div aria-busy="true" aria-label="Ładowanie" className="animate-[fade-in_0.3s_ease-out]">
      <div className="mb-6 pt-2 sm:mb-8 lg:mb-10 lg:pt-4">
        <div className="skeleton h-[clamp(2.3rem,4.4vw,4rem)] w-[min(360px,70%)] rounded-2xl" />
        <div className="skeleton mt-4 h-4 w-[min(420px,85%)] rounded-full" />
      </div>
      {variant === "grid" ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-[132px] rounded-[26px]" style={{ animationDelay: `${i * 70}ms` }} />
          ))}
        </div>
      ) : null}
      <div className="mt-4 grid gap-4 lg:mt-5 lg:grid-cols-[1.4fr_1fr] lg:gap-5">
        <div className="skeleton h-[300px] rounded-[26px]" />
        <div className="skeleton h-[300px] rounded-[26px]" style={{ animationDelay: "120ms" }} />
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
