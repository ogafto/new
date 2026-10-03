import type { Expense, Payment, PaymentStatus } from "@/lib/finance";

export type P = Payment & { status: PaymentStatus };
export type { Expense };
export type Summary = {
  month: { revenue: number; costs: number; profit: number; prevRevenue: number; prevCosts: number };
  year: { revenue: number; costs: number };
  pending: { count: number; amount: number; overdue: number };
  chart: { m: string; revenue: number; costs: number }[];
  paidCount: number;
};
export type Msg = { ok?: string; error?: string };

export const CATS: Record<string, { label: string; dot: string; chip: string; bar: string }> = {
  hosting: { label: "Hosting i domeny", dot: "bg-sky-400", chip: "border-sky-400/20 bg-sky-400/[0.08] text-sky-200", bar: "#38bdf8" },
  tools: { label: "Narzędzia", dot: "bg-accent", chip: "border-accent/25 bg-accent/10 text-accent-2", bar: "#8b6cff" },
  ads: { label: "Reklama", dot: "bg-amber-300", chip: "border-amber-300/20 bg-amber-300/[0.08] text-amber-200", bar: "#fcd34d" },
  hardware: { label: "Sprzęt", dot: "bg-emerald-400", chip: "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200", bar: "#34d399" },
  fees: { label: "Opłaty i prowizje", dot: "bg-pink-400", chip: "border-pink-400/20 bg-pink-400/[0.08] text-pink-200", bar: "#f472b6" },
  other: { label: "Inne", dot: "bg-white/40", chip: "border-white/[0.12] bg-white/[0.04] text-muted", bar: "rgba(255,255,255,0.35)" },
};
export const cat = (k: string) => CATS[k] ?? CATS.other;

export const STATUS: Record<PaymentStatus, { label: string; tone: "default" | "accent" | "green" | "amber" | "red" | "sky" }> = {
  pending: { label: "Oczekuje", tone: "sky" },
  overdue: { label: "Po terminie", tone: "red" },
  paid: { label: "Opłacone", tone: "green" },
  canceled: { label: "Anulowane", tone: "default" },
  refunded: { label: "Zwrot", tone: "amber" },
};
export const METHOD: Record<string, string> = { stripe: "Stripe", transfer: "Przelew", cash: "Gotówka" };

export const zl = (gr: number) => new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: gr % 100 ? 2 : 0 }).format(gr / 100);
export const zlShort = (gr: number) => {
  const v = gr / 100;
  return v >= 1000 ? `${(v / 1000).toLocaleString("pl-PL", { maximumFractionDigits: v >= 10000 ? 0 : 1 })} tys.` : `${Math.round(v)} zł`;
};
export const monthName = (m: string, style: "short" | "long" = "short") => new Intl.DateTimeFormat("pl-PL", { month: style }).format(new Date(`${m}-15T12:00:00`));
const thisYear = (d: Date) => d.getFullYear() === new Date().getFullYear();
export const day = (ms: number) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", ...(thisYear(new Date(ms)) ? {} : { year: "numeric" }) }).format(ms);
export const dayFull = (ms: number) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(ms);
export const isoDay = (iso: string, year = false) => {
  const d = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", ...(year || !thisYear(d) ? { year: "numeric" } : {}) }).format(d);
};
export const today = () => new Date().toLocaleDateString("sv-SE");
export const daysTo = (iso: string) => Math.round((new Date(`${iso}T12:00:00`).getTime() - new Date(`${today()}T12:00:00`).getTime()) / 86_400_000);
export const dueText = (iso: string) => {
  const d = daysTo(iso);
  return d < 0 ? `${-d} ${-d === 1 ? "dzień" : "dni"} po terminie` : d === 0 ? "dziś" : d === 1 ? "jutro" : `za ${d} dni`;
};
export const initials = (n: string) =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
export const hue = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
export const isOpen = (p: P) => p.status === "pending" || p.status === "overdue";
export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l");
