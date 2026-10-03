"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, Reorder } from "motion/react";
import { deleteProject, duplicateProject, reorderProjects, toggleProject } from "@/app/panel/admin/portfolio/actions";
import type { AdminProject } from "@/lib/projects";
import { serviceName, services, type ServiceId } from "@/lib/site";
import { Card, ConfirmBtn, Count, ease, Empty, field, ICONS, Icon, spotMove, Tabs } from "./kit";

type Views = Record<string, { views: number; visitors: number }>;
type Status = "all" | "visible" | "hidden" | "featured";
type View = "grid" | "list";
const LIST_ICON = "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01";

function Pill({ on, onClick, children, tone, glass = false }: { on: boolean; onClick: () => void; children: React.ReactNode; tone: "green" | "accent"; glass?: boolean }) {
  const c = glass
    ? on
      ? `border-white/10 bg-black/65 ${tone === "green" ? "text-emerald-200" : "text-[#cfc3ff]"}`
      : "border-white/10 bg-black/50 text-white/60 hover:text-white"
    : on
      ? tone === "green"
        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
        : "border-accent/35 bg-accent/15 text-accent-2"
      : "border-line-2 text-dim hover:text-ink";
  return (
    <button type="button" onClick={onClick} className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12px] whitespace-nowrap transition-colors ${glass ? "backdrop-blur-md" : ""} ${c}`}>
      {children}
    </button>
  );
}

const StatusDot = ({ on }: { on: boolean }) => <span className={`size-1.5 rounded-full ${on ? "bg-emerald-400 shadow-[0_0_8px_rgb(52_211_153/0.8)]" : "bg-white/30"}`} />;

function IconBtn({ label, icon, onClick, href, external, className = "" }: { label: string; icon: string; onClick?: () => void; href?: string; external?: boolean; className?: string }) {
  const cls = `grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-ink ${className}`;
  if (href)
    return external ? (
      <a href={href} target="_blank" className={cls} aria-label={label} title={label}>
        <Icon d={icon} className="size-4" />
      </a>
    ) : (
      <Link href={href} className={cls} aria-label={label} title={label}>
        <Icon d={icon} className="size-4" />
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cls} aria-label={label} title={label}>
      <Icon d={icon} className="size-4" />
    </button>
  );
}

export default function ProjectList({ projects, views }: { projects: AdminProject[]; views: Views }) {
  const router = useRouter();
  const [items, setItems] = useState(projects);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<ServiceId | "all">("all");
  const [status, setStatus] = useState<Status>("all");
  const [view, setView] = useState<View>("grid");
  const [, start] = useTransition();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const v = localStorage.getItem("afto-portfolio-view");
        if (v === "list" || v === "grid") setView(v);
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, []);
  const pickView = (v: View) => {
    setView(v);
    try {
      localStorage.setItem("afto-portfolio-view", v);
    } catch {}
  };

  const filtered = useMemo(
    () =>
      items.filter(
        (p) =>
          (cat === "all" || p.category === cat) &&
          (status === "all" || (status === "visible" ? p.published : status === "hidden" ? !p.published : p.featured && p.published)) &&
          (!q || `${p.name} ${p.client} ${p.slug}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [items, cat, status, q],
  );
  const filtering = cat !== "all" || status !== "all" || !!q;
  const maxViews = Math.max(1, ...Object.values(views).map((v) => v.views));
  const totalViews = Object.values(views).reduce((a, v) => a + v.views, 0);
  const homeIds = new Set(items.filter((x) => x.published && x.featured).slice(0, 6).map((x) => x.id));

  const toggle = (p: AdminProject, f: "published" | "featured") =>
    start(async () => {
      setItems((x) => x.map((y) => (y.id === p.id ? { ...y, [f]: !y[f] } : y)));
      await toggleProject(p.id, f);
    });
  const duplicate = (p: AdminProject) =>
    start(async () => {
      const r = await duplicateProject(p.id);
      if (r.id) router.push(`/panel/admin/portfolio/${r.id}`);
    });
  const remove = (p: AdminProject) => start(async () => (await deleteProject(p.id), setItems((x) => x.filter((y) => y.id !== p.id))));

  if (!items.length)
    return (
      <Card>
        <Empty icon={ICONS.grid} title="Portfolio jest puste" text="Pierwszy projekt pojawi się od razu na stronie.">
          <Link href="/panel/admin/portfolio/nowy" className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[13.5px] font-medium text-bg transition-colors hover:bg-white">
            <Icon d={ICONS.plus} className="size-4" /> Dodaj projekt
          </Link>
        </Empty>
      </Card>
    );

  const stats = [
    { label: "Projekty", v: items.length, icon: ICONS.grid },
    { label: "Widoczne", v: items.filter((p) => p.published).length, icon: ICONS.eye },
    { label: "Na stronie głównej", v: homeIds.size, icon: ICONS.star, suffix: " / 6" },
    { label: "Odsłony · 30 dni", v: totalViews, icon: ICONS.chart },
  ];
  const catItems = [{ value: "all" as const, label: "Wszystkie", count: items.length }, ...services.map((s) => ({ value: s.id, label: s.name, count: items.filter((p) => p.category === s.id).length }))].filter((x) => x.value === "all" || x.count > 0);

  return (
    <div className="space-y-4">
      <motion.div className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-white/[0.07] bg-white/[0.06] lg:grid-cols-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }}>
        {stats.map((s) => (
          <div key={s.label} className="group bg-[rgb(13_13_18/0.92)] p-4 sm:p-5">
            <p className="flex items-center gap-2 text-[12.5px] text-dim">
              <Icon d={s.icon} className="size-3.5 transition-colors group-hover:text-accent-2" />
              {s.label}
            </p>
            <p className="mt-2 flex items-baseline gap-1">
              <Count value={s.v} className="h-display text-[28px] leading-none sm:text-[32px]" />
              {s.suffix && <span className="text-[13px] text-dim">{s.suffix}</span>}
            </p>
          </div>
        ))}
      </motion.div>

      {/* pasek narzędzi */}
      <motion.div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08, duration: 0.4 }}>
        <div className="-mx-1 min-w-0 overflow-x-auto px-1 [scrollbar-width:none]" data-lenis-prevent>
          <Tabs id="pf-cat" value={cat} onChange={(v) => setCat(v as ServiceId | "all")} items={catItems} />
        </div>
        <div className="flex min-w-0 gap-2">
          <div className="relative min-w-0 flex-1 2xl:w-60 2xl:flex-none">
            <Icon d={ICONS.search} className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-dim" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj…" className={`${field} h-10 rounded-full pl-9 text-[13.5px]`} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="h-10 shrink-0 rounded-full border border-line-2 bg-surface px-3.5 text-[13.5px] text-ink outline-none transition-colors hover:border-white/25 focus:border-accent" aria-label="Status">
            <option value="all">Każdy status</option>
            <option value="visible">Widoczne</option>
            <option value="hidden">Ukryte</option>
            <option value="featured">Na głównej</option>
          </select>
          <div className="flex shrink-0 gap-0.5 rounded-full border border-line p-1" role="group" aria-label="Widok">
            {(["grid", "list"] as const).map((v) => (
              <button key={v} type="button" onClick={() => pickView(v)} className={`relative grid size-8 place-items-center rounded-full transition-colors ${view === v ? "text-ink" : "text-dim hover:text-ink"}`} aria-label={v === "grid" ? "Siatka" : "Lista"} aria-pressed={view === v}>
                {view === v && <motion.span layoutId="pf-view" className="absolute inset-0 rounded-full bg-white/[0.08]" transition={{ type: "spring", stiffness: 480, damping: 38 }} />}
                <Icon d={v === "grid" ? ICONS.grid : LIST_ICON} className="relative size-4" />
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="flex min-h-5 items-center justify-between gap-3 px-1 text-[12.5px] text-dim">
        <span className="truncate">
          {filtering ? `${filtered.length} z ${items.length}` : view === "list" ? "Przeciągnij, by zmienić kolejność · 6 pierwszych wyróżnionych trafia na główną" : `${items.length} projektów · kolejność zmienisz w widoku listy`}
        </span>
        <AnimatePresence>
          {saved && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex shrink-0 items-center gap-1.5 text-emerald-300">
              <Icon d={ICONS.check} className="size-3.5" /> Zapisano kolejność
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {view === "grid" ? (
          <motion.ul key="grid" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <AnimatePresence initial={false}>
              {filtered.map((p, i) => {
                const v = views[p.slug];
                const onHome = homeIds.has(p.id);
                return (
                  <motion.li
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ delay: Math.min(i, 8) * 0.035, duration: 0.4, ease }}
                    onPointerMove={spotMove}
                    className="spot edge group relative overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,rgb(22_22_30/0.82),rgb(13_13_18/0.82))] shadow-[0_24px_60px_-40px_rgb(0_0_0/0.9)]"
                  >
                    <Link href={`/panel/admin/portfolio/${p.id}`} className="relative block aspect-[16/11] overflow-hidden bg-white/5" aria-label={`Edytuj ${p.name}`}>
                      <Image src={p.image} alt="" fill sizes="(min-width:1280px) 380px, (min-width:640px) 50vw, 100vw" className={`object-cover object-top transition-[transform,filter,opacity] duration-700 ease-out-expo group-hover:scale-[1.04] ${p.published ? "" : "opacity-50 grayscale"}`} />
                      <span className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.35),transparent_30%)]" />
                    </Link>
                    {/* nakładka statusu */}
                    <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                      <span className="pointer-events-auto flex flex-wrap gap-1.5">
                        <Pill glass on={p.published} tone="green" onClick={() => toggle(p, "published")}>
                          <StatusDot on={p.published} />
                          {p.published ? "Widoczny" : "Ukryty"}
                        </Pill>
                        <Pill glass on={p.featured} tone="accent" onClick={() => toggle(p, "featured")}>
                          <Icon d={ICONS.star} className="size-3" />
                          {onHome ? "Na głównej" : p.featured ? "Wyróżniony" : "Wyróżnij"}
                        </Pill>
                      </span>
                      <span className="rounded-full bg-black/45 px-2 py-0.5 text-[11px] text-white/70 tabular-nums backdrop-blur-md">{String(items.indexOf(p) + 1).padStart(2, "0")}</span>
                    </div>
                    <div className="relative px-4 pt-3.5 pb-4">
                      <p className="text-[11.5px] text-accent-2">{serviceName(p.category)}</p>
                      <p className="mt-0.5 truncate text-[17px] font-medium tracking-[-0.01em]">{p.name}</p>
                      <p className="truncate text-[12.5px] text-dim">
                        {p.client} · {p.year}
                      </p>
                      <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                        <span className="flex min-w-0 items-center gap-2 text-[12px] text-dim tabular-nums">
                          <Icon d={ICONS.eye} className="size-3.5 shrink-0" />
                          <span className="truncate">{v ? `${v.views} odsłon · ${v.visitors} os.` : "brak odsłon"}</span>
                        </span>
                        <span className="-mr-1.5 flex shrink-0 items-center">
                          <IconBtn label="Edytuj" icon={ICONS.edit} href={`/panel/admin/portfolio/${p.id}`} />
                          <IconBtn label="Duplikuj" icon={ICONS.copy} onClick={() => duplicate(p)} />
                          <IconBtn label="Zobacz na stronie" icon={ICONS.site} href={`/portfolio/${p.slug}`} external />
                          <ConfirmBtn onConfirm={() => remove(p)} label="Usunąć?">
                            <span className="sr-only">Usuń</span>
                          </ConfirmBtn>
                        </span>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
            {!filtering && (
              <li>
                <Link href="/panel/admin/portfolio/nowy" className="group flex h-full min-h-[240px] flex-col items-center justify-center gap-3 rounded-[22px] border border-dashed border-white/[0.1] text-[14px] text-muted transition-colors hover:border-accent/40 hover:bg-accent/[0.04] hover:text-ink">
                  <span className="grid size-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-accent-2 transition-transform duration-500 ease-out-expo group-hover:scale-110 group-hover:rotate-90">
                    <Icon d={ICONS.plus} />
                  </span>
                  Nowy projekt
                </Link>
              </li>
            )}
          </motion.ul>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <Card pad={false}>
              <Reorder.Group axis="y" values={filtering ? filtered : items} onReorder={filtering ? () => {} : setItems} className="divide-y divide-white/[0.06]" as="ul">
                {(filtering ? filtered : items).map((p, i) => {
                  const v = views[p.slug];
                  const onHome = homeIds.has(p.id);
                  return (
                    <Reorder.Item
                      key={p.id}
                      value={p}
                      dragListener={!filtering}
                      className="group relative bg-[rgb(15_15_20)] px-3 py-3 transition-colors hover:bg-[rgb(19_19_26)] sm:px-5"
                      whileDrag={{ scale: 1.01, boxShadow: "0 20px 50px -20px rgba(0,0,0,0.8)", zIndex: 10 }}
                      onDragEnd={() =>
                        start(async () => {
                          await reorderProjects(items.map((x) => x.id));
                          setSaved(true);
                          setTimeout(() => setSaved(false), 1800);
                        })
                      }
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        {!filtering && (
                          <span className="cursor-grab touch-none text-dim transition-colors group-hover:text-muted active:cursor-grabbing" aria-label="Przeciągnij">
                            <Icon d={ICONS.drag} />
                          </span>
                        )}
                        <span className="hidden w-5 text-[12px] text-dim tabular-nums sm:block">{String(i + 1).padStart(2, "0")}</span>
                        <span className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/[0.06] sm:h-14 sm:w-[84px] ${p.published ? "" : "opacity-50 grayscale"}`}>
                          <Image src={p.image} alt="" fill sizes="96px" className="pointer-events-none object-cover object-top" />
                          {onHome && <span className="absolute top-1 left-1 size-1.5 rounded-full bg-accent-2 shadow-[0_0_8px_#b4a2ff]" title="Na stronie głównej" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-[14.5px]">{p.name}</span>
                            {onHome && <span className="hidden shrink-0 rounded-full bg-accent/15 px-1.5 py-px text-[10.5px] text-accent-2 sm:inline">główna</span>}
                          </span>
                          <span className="block truncate text-[12.5px] text-dim">
                            {serviceName(p.category)} · {p.client} · {p.year}
                          </span>
                        </span>
                        <span className="hidden w-36 shrink-0 md:block">
                          <span className="block h-1 overflow-hidden rounded-full bg-white/[0.06]">
                            <span className="block h-full rounded-full bg-gradient-to-r from-accent to-accent-2" style={{ width: `${((v?.views ?? 0) / maxViews) * 100}%` }} />
                          </span>
                          <span className="mt-1.5 block text-[11.5px] text-dim tabular-nums">{v ? `${v.views} odsłon · ${v.visitors} os.` : "brak odsłon"}</span>
                        </span>
                        <span className="hidden items-center gap-1.5 lg:flex">
                          <Pill on={p.published} tone="green" onClick={() => toggle(p, "published")}>
                            <StatusDot on={p.published} />
                            {p.published ? "Widoczny" : "Ukryty"}
                          </Pill>
                          <Pill on={p.featured} tone="accent" onClick={() => toggle(p, "featured")}>
                            <Icon d={ICONS.star} className="size-3" />
                            {p.featured ? "Wyróżniony" : "Wyróżnij"}
                          </Pill>
                        </span>
                        <span className="flex items-center">
                          <IconBtn label="Edytuj" icon={ICONS.edit} href={`/panel/admin/portfolio/${p.id}`} />
                          <IconBtn label="Duplikuj" icon={ICONS.copy} onClick={() => duplicate(p)} className="!hidden sm:!grid" />
                          <IconBtn label="Zobacz na stronie" icon={ICONS.site} href={`/portfolio/${p.slug}`} external className="!hidden sm:!grid" />
                          <ConfirmBtn onConfirm={() => remove(p)} label="Usunąć?">
                            <span className="sr-only">Usuń</span>
                          </ConfirmBtn>
                        </span>
                      </div>
                      {/* telefon / tablet: przełączniki pod spodem */}
                      <div className={`mt-2.5 flex gap-1.5 lg:hidden ${filtering ? "pl-[76px] sm:pl-[136px]" : "pl-[112px] sm:pl-[176px]"}`}>
                        <Pill on={p.published} tone="green" onClick={() => toggle(p, "published")}>
                          <StatusDot on={p.published} />
                          {p.published ? "Widoczny" : "Ukryty"}
                        </Pill>
                        <Pill on={p.featured} tone="accent" onClick={() => toggle(p, "featured")}>
                          <Icon d={ICONS.star} className="size-3" />
                          {p.featured ? "Wyróżniony" : "Wyróżnij"}
                        </Pill>
                      </div>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      {filtering && !filtered.length && (
        <Card>
          <Empty icon={ICONS.search} title="Nic nie pasuje do filtrów">
            <button
              type="button"
              onClick={() => {
                setQ("");
                setCat("all");
                setStatus("all");
              }}
              className="text-[13px] text-accent-2 hover:text-ink"
            >
              Wyczyść filtry
            </button>
          </Empty>
        </Card>
      )}
    </div>
  );
}
