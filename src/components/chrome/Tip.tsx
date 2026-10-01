// Ciemny dymek podpowiedzi jak w edytorze (z opcjonalnym skrótem klawiszowym).
export default function Tip({ label, kbd, side = "top" }: { label: string; kbd?: string; side?: "top" | "bottom" }) {
  return (
    <span
      role="tooltip"
      className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 rounded-md bg-[#1e1e1e] px-2 py-1.5 font-ui text-[11px] whitespace-nowrap text-white opacity-0 transition-opacity delay-300 group-hover:opacity-100 ${
        side === "top" ? "bottom-full mb-2" : "top-full mt-2"
      }`}
    >
      {label}
      {kbd && <span className="ml-2 text-white/50">{kbd}</span>}
    </span>
  );
}
