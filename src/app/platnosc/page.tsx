import type { Metadata } from "next";
import Link from "next/link";
import { Mark } from "@/components/brand/Logo";

export const metadata: Metadata = { title: "Płatność", robots: { index: false } };

// Strona po płatności przez Stripe (przekierowanie z linku płatności)
export default function PaymentDone() {
  return (
    <main className="grid min-h-[100svh] place-items-center px-5 py-24">
      <div className="edge w-full max-w-[460px] rounded-[30px] bg-surface/80 p-8 text-center sm:p-10">
        <div className="relative mx-auto grid size-20 place-items-center">
          <span className="absolute inset-0 rounded-full bg-emerald-400/20 blur-2xl" />
          <svg viewBox="0 0 64 64" className="relative size-16" fill="none" aria-hidden>
            <circle cx="32" cy="32" r="30" stroke="#34d399" strokeWidth="1.5" />
            <path d="M20 33l8 8 16-17" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="h-display mt-6 text-[34px]">Dziękuję za płatność</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">Wpłata dotarła. Potwierdzenie przyjdzie na Twój e-mail ze Stripe, a status zobaczysz też w panelu klienta.</p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/panel" className="btn btn-primary justify-center">
            Panel klienta
          </Link>
          <Link href="/" className="btn btn-outline justify-center">
            <Mark className="size-5" /> Strona główna
          </Link>
        </div>
      </div>
    </main>
  );
}
