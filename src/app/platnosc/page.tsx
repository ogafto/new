import type { Metadata } from "next";
import Link from "next/link";
import { Mark, Wordmark } from "@/components/brand/Logo";
import { ResultMark, Rise } from "@/components/pay/Result";
import { currentUser } from "@/lib/auth/session";
import { confirmSession, zl } from "@/lib/finance";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Płatność", robots: { index: false } };

const fmt = (ms: number) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }).format(ms);

/*
 * Strona po płatności przez Stripe. Adres niesie id sesji Checkout — sprawdzamy ją w Stripe
 * i od razu oznaczamy płatność jako opłaconą (nie czekając na webhook), więc panel klienta i admina od razu to pokazują.
 */
export default async function PaymentDone({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const [p, user] = await Promise.all([session_id ? confirmSession(session_id).catch(() => null) : null, currentUser()]);
  const paid = !p || p.status === "paid";
  const rows: [string, string][] = p
    ? [
        ["Za", p.title],
        ["Kwota", zl(Number(p.amount))],
        ["Status", p.status === "paid" ? "Opłacone" : "W trakcie księgowania"],
        ...(p.status === "paid" && p.paid_at ? ([["Data", fmt(Number(p.paid_at))]] as [string, string][]) : []),
      ]
    : [];

  return (
    <main className="relative grid min-h-[100svh] place-items-center overflow-hidden px-5 py-24">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.035)_0_1px,transparent_1px_96px)] [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]" />
        <div className={`absolute top-[-20%] left-1/2 h-[70vh] w-[90vw] -translate-x-1/2 ${paid ? "bg-[radial-gradient(closest-side,rgb(52_211_153/0.12),transparent)]" : "bg-[radial-gradient(closest-side,rgb(139_108_255/0.18),transparent)]"}`} />
      </div>

      <Link href="/" className="absolute top-6 left-5 flex items-center gap-2.5 sm:left-10" aria-label={site.domain}>
        <Mark className="size-8" />
        <Wordmark className="h-[19px] w-auto" />
      </Link>

      <div className="relative w-full max-w-[520px] text-center">
        <ResultMark ok={paid} />
        <Rise>
          <p className="kicker mx-auto mt-8">{paid ? "Płatność przyjęta" : "Płatność w toku"}</p>
        </Rise>
        <Rise i={1}>
          <h1 className="h-display mt-5 text-[clamp(2.6rem,7vw,4rem)] leading-[0.95]">{paid ? "Dziękuję!" : "Prawie gotowe."}</h1>
        </Rise>
        <Rise i={2}>
          <p className="mx-auto mt-4 max-w-[400px] text-[16px] leading-relaxed text-muted">
            {paid ? "Wpłata dotarła i jest już widoczna w panelu klienta. Potwierdzenie ze Stripe przyjdzie na Twój e-mail." : "Bank jeszcze księguje przelew — status w panelu zmieni się sam, gdy tylko dotrze potwierdzenie."}
          </p>
        </Rise>

        {rows.length > 0 && (
          <Rise i={3}>
            <dl className="mt-8 overflow-hidden rounded-[22px] bg-surface text-left ring-1 ring-white/[0.05] ring-inset">
              {rows.map(([k, v], i) => (
                <div key={k} className={`flex items-center justify-between gap-6 px-5 py-3.5 ${i ? "border-t border-line" : ""}`}>
                  <dt className="text-[13.5px] text-dim">{k}</dt>
                  <dd className={`min-w-0 truncate text-right text-[15px] ${k === "Status" ? (paid ? "text-emerald-300" : "text-accent-2") : ""} ${k === "Kwota" ? "text-[18px] tabular-nums" : ""}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </Rise>
        )}

        <Rise i={4} className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link href={user ? "/panel/platnosci" : "/konto/logowanie"} className="group btn btn-primary justify-center">
            <span className="roll">
              <span>{user ? "Wróć do panelu" : "Zaloguj się do panelu"}</span>
              <span aria-hidden>{user ? "Wróć do panelu" : "Zaloguj się do panelu"}</span>
            </span>
            <span className="dot">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M3.5 10.5l7-7M4.5 3.5h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M3.5 10.5l7-7M4.5 3.5h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
          <Link href="/" className="btn btn-outline justify-center">
            Strona główna
          </Link>
        </Rise>
        <Rise i={5}>
          <p className="mt-8 text-[12.5px] text-dim">
            Pytania? <a href={`mailto:${site.email}`} className="text-muted underline-offset-4 hover:text-ink hover:underline">{site.email}</a>
          </p>
        </Rise>
      </div>
    </main>
  );
}
