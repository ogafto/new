// Sygnet afto: kwadrat, litera "a" i niebieska kropka zaznaczenia.
export default function Mark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#0B0B0C" />
      <text x="7" y="23" fill="#fff" fontFamily="var(--font-archivo)" fontWeight="700" fontSize="20" style={{ fontStretch: "120%" }}>
        a
      </text>
      <rect x="22" y="19" width="4" height="4" fill="#0D99FF" />
    </svg>
  );
}
