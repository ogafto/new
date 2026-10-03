"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { LogRow } from "@/lib/logs";
import { Btn, Card, ease, Empty, Icon, ICONS, PageHead } from "./kit";
import { SearchField, Segmented } from "./views/ui";

type Filters = { typ: string; poziom: string; q: string; przed: string };

const LEVEL = {
  info: { label: "Info", dot: "bg-sky-400", text: "text-sky-200", row: "" },
  success: { label: "Sukces", dot: "bg-emerald-400", text: "text-emerald-200", row: "" },
  warn: { label: "Ostrzeżenie", dot: "bg-amber-300", text: "text-amber-200", row: "bg-amber-300/[0.025]" },
  error: { label: "Błąd", dot: "bg-red-400", text: "text-red-200", row: "bg-red-400/[0.04]" },
} as const;

const KIND_ICON: Record<string, string> = { auth: ICONS.key, settings: ICONS.gear, payment: ICONS.wallet, inquiry: ICONS.inbox, content: ICONS.doc, client: ICONS.users, mail: ICONS.mail, system: ICONS.logs };

const TZ = "Europe/Warsaw";
const dayKey = (ms: number) => new Date(ms).toLocaleDateString("sv-SE", { timeZone: TZ });
const dayLabel = (ms: number) => {
  const k = dayKey(ms);
  if (k === dayKey(Date.now())) return "Dziś";
  if (k === dayKey(Date.now() - 86_400_000)) return "Wczoraj";
  return new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long", timeZone: TZ }).format(ms);
};
const time = (ms: number) => new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: TZ }).format(ms);
const full = (ms: number) => new Intl.DateTimeFormat("pl-PL", { dateStyle: "long", timeStyle: "medium", timeZone: TZ }).format(ms);

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[4px] bg-accent/30 px-0.5 text-ink">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

function Item({ r, kinds, q }: { r: LogRow; kinds: Record<string, string>; q: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const lv = LEVEL[r.level] ?? LEVEL.info;
  let meta: Record<string, unknown> | null = null;
  try {
    meta = r.meta ? (JSON.parse(r.meta) as Record<string, unknown>) : null;
  } catch {
    meta = { meta: r.meta };
  }
  const details = [["czas", full(r.ts)], ["poziom", lv.label], ["typ", kinds[r.kind] ?? r.kind], ...(r.actor ? [["kto", r.actor]] : []), ...(r.ip ? [["ip", r.ip]] : []), ...Object.entries(meta ?? {}).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)])];
  return (
    <li className={`group/row border-b border-white/[0.045] last:border-0 ${lv.row}`}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`relative w-full text-left transition-colors hover:bg-white/[0.025] ${open ? "bg-white/[0.025]" : ""}`}>
        {(r.level === "error" || r.level === "warn") && <span className={`absolute inset-y-0 left-0 w-[2px] ${r.level === "error" ? "bg-red-400/70" : "bg-amber-300/60"}`} />}
        {/* telefon */}
        <div className="px-4 py-3 md:hidden">
          <div className="flex items-center gap-2 text-[12px]">
            <span className={`size-1.5 shrink-0 rounded-full ${lv.dot}`} />
            <span className="inline-flex items-center gap-1 text-muted">
              <Icon d={KIND_ICON[r.kind] ?? ICONS.logs} className="size-3.5 text-dim" />
              {kinds[r.kind] ?? r.kind}
            </span>
            <span className="ml-auto font-mono text-[11.5px] text-dim tabular-nums">{time(r.ts)}</span>
          </div>
          <p className="mt-1.5 text-[13.5px] leading-snug break-words">
            <Highlight text={r.message} q={q} />
          </p>
          {r.actor && <p className="mt-1 truncate text-[12px] text-dim">{r.actor}</p>}
        </div>
        {/* tablet / desktop */}
        <div className="hidden min-h-[46px] grid-cols-[76px_16px_128px_minmax(0,1fr)_24px] lg:grid-cols-[76px_104px_128px_minmax(0,1fr)_24px] items-center gap-3 px-5 py-2 md:grid xl:grid-cols-[76px_104px_128px_minmax(0,1fr)_200px_24px]">
          <span className="font-mono text-[12px] text-dim tabular-nums">{time(r.ts)}</span>
          <span className={`flex items-center gap-2 text-[12.5px] ${lv.text}`}>
            <span className="relative flex size-2 shrink-0">
              {r.level === "error" && <span className="absolute inset-0 animate-ping rounded-full bg-red-400/60 [animation-duration:2.4s]" />}
              <span className={`relative size-2 rounded-full ${lv.dot}`} />
            </span>
            <span className="hidden lg:inline">{lv.label}</span>
          </span>
          <span className="inline-flex w-fit max-w-full items-center gap-1.5 truncate rounded-full border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-[12px] text-muted">
            <Icon d={KIND_ICON[r.kind] ?? ICONS.logs} className="size-3.5 shrink-0 text-dim" />
            {kinds[r.kind] ?? r.kind}
          </span>
          <span className={`text-[13.5px] leading-snug ${open ? "break-words" : "truncate"}`}>
            <Highlight text={r.message} q={q} />
          </span>
          <span className="hidden truncate text-[12.5px] text-dim xl:block">{r.actor ?? "—"}</span>
          <Icon d="M6 9l6 6 6-6" className={`size-4 justify-self-end text-dim transition-transform duration-300 ${open ? "rotate-180 text-muted" : "opacity-0 group-hover/row:opacity-100"}`} />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease }} className="overflow-hidden">
            <div className="mx-4 mb-3 rounded-xl border border-white/[0.07] bg-black/30 md:mr-5 md:ml-[96px]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2 text-[11.5px] text-dim">
                <span className="font-mono">#{r.id.slice(0, 12)}</span>
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard.writeText(JSON.stringify({ ...r, meta }, null, 2)).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1400);
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors hover:bg-white/[0.06] hover:text-ink"
                >
                  <Icon d={copied ? ICONS.check : ICONS.copy} className="size-3.5" />
                  {copied ? "Skopiowano" : "Kopiuj JSON"}
                </button>
              </div>
              <dl className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-4 gap-y-1.5 p-3.5 font-mono text-[12px]">
                {details.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-dim">{k}</dt>
                    <dd className={`break-all ${k === "poziom" ? lv.text : "text-muted"}`}>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function LogList({ rows, more, kinds, stats, filters }: { rows: LogRow[]; more: boolean; kinds: Record<string, string>; stats: { total: number; errors: number; warns: number; logins: number }; filters: Filters }) {
  const router = useRouter();
  const path = usePathname();
  const [q, setQ] = useState(filters.q);
  const [pending, start] = useTransition();
  const href = (p: Partial<Filters>) => {
    const next = { ...filters, przed: "", ...p };
    const s = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
    return s ? `${path}?${s}` : path;
  };
  const go = (p: Partial<Filters>) => start(() => router.push(href(p), { scroll: false }));

  // wyszukiwanie z opóźnieniem
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (q === filters.q) return;
    const t = setTimeout(() => start(() => router.replace(href({ q }), { scroll: false })), 350);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const groups: { key: string; label: string; items: LogRow[] }[] = [];
  for (const r of rows) {
    const k = dayKey(r.ts);
    const g = groups.at(-1);
    if (g?.key === k) g.items.push(r);
    else groups.push({ key: k, label: dayLabel(r.ts), items: [r] });
  }
  const active = [filters.typ, filters.poziom, filters.q].filter(Boolean).length;

  const tiles = [
    { label: "Zdarzenia · 24 h", value: stats.total, tone: "", dot: "bg-white/40", f: { typ: "", poziom: "" }, on: !filters.typ && !filters.poziom },
    { label: "Błędy", value: stats.errors, tone: stats.errors ? "text-red-300" : "", dot: "bg-red-400", f: { poziom: "error", typ: "" }, on: filters.poziom === "error" },
    { label: "Ostrzeżenia", value: stats.warns, tone: stats.warns ? "text-amber-200" : "", dot: "bg-amber-300", f: { poziom: "warn", typ: "" }, on: filters.poziom === "warn" },
    { label: "Logowania", value: stats.logins, tone: "", dot: "bg-accent", f: { typ: "auth", poziom: "" }, on: filters.typ === "auth" && !filters.poziom },
  ];

  return (
    <>
      <PageHead kicker="System" title="Logi">
        <Btn size="sm" variant="ghost" icon={ICONS.refresh} disabled={pending} onClick={() => start(() => router.refresh())}>
          Odśwież
        </Btn>
      </PageHead>

      <Card pad={false}>
        <div className="overflow-hidden">
          <div className="-mr-px -mb-px grid grid-cols-2 lg:grid-cols-4">
            {tiles.map((t) => (
              <Link key={t.label} href={href(t.f)} scroll={false} className="group relative border-r border-b border-white/[0.06] px-5 py-4 transition-colors hover:bg-white/[0.02] sm:py-5">
                {t.on && <motion.span layoutId="log-tile" className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent to-accent-2 shadow-[0_0_14px_rgb(139_108_255/0.8)]" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                <p className={`flex items-center gap-2 text-[12.5px] ${t.on ? "text-ink" : "text-dim"}`}>
                  <span className={`size-1.5 rounded-full ${t.dot}`} />
                  {t.label}
                </p>
                <p className={`h-display mt-2 text-[28px] leading-none tabular-nums ${t.tone}`}>{t.value.toLocaleString("pl-PL")}</p>
              </Link>
            ))}
          </div>
        </div>
      </Card>

      {/* pasek narzędzi — przyklejony pod nagłówkiem */}
      <div className="z-20 -mx-1 mt-4 px-1 md:sticky md:top-[64px] lg:top-[84px]">
        <div className="flex flex-col gap-2.5 rounded-[20px] border border-white/[0.08] bg-[rgb(14_14_20/0.82)] p-2.5 shadow-[0_20px_50px_-30px_rgb(0_0_0/0.9),inset_0_1px_0_rgb(255_255_255/0.05)] backdrop-blur-xl 2xl:flex-row 2xl:items-center">
          <Segmented id="log-kind" value={filters.typ} onChange={(v) => go({ typ: v })} items={[{ value: "", label: "Wszystko" }, ...Object.entries(kinds).map(([k, l]) => ({ value: k, label: l }))]} />
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:flex-nowrap 2xl:justify-end">
            <Segmented
              id="log-level"
              value={filters.poziom}
              onChange={(v) => go({ poziom: v })}
              items={[{ value: "", label: "Każdy" }, ...Object.entries(LEVEL).map(([k, v]) => ({ value: k, label: k === "warn" ? "Ostrz." : v.label, dot: v.dot }))]}
            />
            <SearchField value={q} onChange={setQ} onSubmit={() => go({ q })} placeholder="Szukaj w logach…" className="min-w-0 flex-1 basis-[200px] 2xl:max-w-[260px]" />
          </div>
        </div>
      </div>

      <Card delay={0.08} pad={false} className="mt-3">
        <div className={`transition-opacity duration-300 ${pending ? "opacity-50" : ""}`}>
          <div className="hidden grid-cols-[76px_16px_128px_minmax(0,1fr)_24px] lg:grid-cols-[76px_104px_128px_minmax(0,1fr)_24px] gap-3 border-b border-white/[0.06] bg-white/[0.015] px-5 py-2.5 text-[12.5px] text-dim md:grid xl:grid-cols-[76px_104px_128px_minmax(0,1fr)_200px_24px]">
            <span>Czas</span>
            <span><span className="hidden lg:inline">Poziom</span></span>
            <span>Typ</span>
            <span>Zdarzenie</span>
            <span className="hidden xl:block">Kto</span>
            <span />
          </div>
          {groups.length ? (
            groups.map((g) => (
              <section key={g.key}>
                <h3 className="flex items-center gap-3 border-b border-white/[0.05] bg-white/[0.012] px-5 py-2 text-[12px] text-muted">
                  <span className="first-letter:uppercase">{g.label}</span>
                  <span className="h-px flex-1 bg-white/[0.05]" />
                  <span className="text-dim tabular-nums">{g.items.length}</span>
                </h3>
                <ul>
                  {g.items.map((r) => (
                    <Item key={r.id} r={r} kinds={kinds} q={filters.q} />
                  ))}
                </ul>
              </section>
            ))
          ) : (
            <Empty icon={ICONS.logs} title={active ? "Nic nie pasuje" : "Brak wpisów"} text={active ? "Zmień filtry albo frazę." : undefined}>
              {active > 0 && (
                <Btn size="sm" icon={ICONS.close} onClick={() => (setQ(""), go({ typ: "", poziom: "", q: "" }))}>
                  Wyczyść filtry
                </Btn>
              )}
            </Empty>
          )}
          {(more || rows.length > 0) && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3.5 text-[12.5px] text-dim">
              <span>
                {rows.length} {rows.length === 1 ? "wpis" : rows.length % 10 >= 2 && rows.length % 10 <= 4 && (rows.length % 100 < 10 || rows.length % 100 >= 20) ? "wpisy" : "wpisów"}
                {filters.przed && (
                  <>
                    {" · "}
                    <Link href={href({})} scroll={false} className="text-accent-2 hover:underline">
                      najnowsze
                    </Link>
                  </>
                )}
              </span>
              {more && (
                <Link href={href({ przed: String(rows.at(-1)!.ts) })} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] px-3.5 py-1.5 text-muted transition-colors hover:border-white/25 hover:text-ink">
                  Starsze wpisy <Icon d={ICONS.arrowDown} className="size-3" />
                </Link>
              )}
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
