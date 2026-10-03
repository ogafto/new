"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, Reorder } from "motion/react";
import { deleteProject, duplicateProject, reorderProjects, toggleProject } from "@/app/panel/admin/portfolio/actions";
import type { AdminProject } from "@/lib/projects";
import { serviceName, services, type ServiceId } from "@/lib/site";
import { Card, ConfirmBtn, ease, Empty, field, ICONS, Icon } from "./kit";

type Views = Record<string, { views: number; visitors: number }>;
type Status = "all" | "visible" | "hidden" | "featured";

function Pill({ on, onClick, children, tone }: { on: boolean; onClick: () => void; children: React.ReactNode; tone: "green" | "accent" }) {
  const c = on ? (tone === "green" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-accent/35 bg-accent/12 text-accent-2") : "border-line-2 text-dim hover:text-ink";
  return (
    <button type="button" onClick={onClick} className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12px] whitespace-nowrap transition-colors ${c}`}>
      {children}
    </button>
  );
}

export default function ProjectList({ projects, views }: { projects: AdminProject[]; views: Views }) {
  const router = useRouter();
  const [items, setItems] = useState(projects);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<ServiceId | "all">("all");
  const [status, setStatus] = useState<Status>("all");
  const [, start] = useTransition();
  const [saved, setSaved] = useState(false);

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

  const toggle = (p: AdminProject, field: "published" | "featured") =>
    start(async () => {
      setItems((x) => x.map((y) => (y.id === p.id ? { ...y, [field]: !y[field] } : y)));
      await toggleProject(p.id, field);
    });

  if (!items.length)
    return (
      <Card>
        <Empty icon={ICONS.grid} title="Portfolio jest puste" text="Dodaj pierwszy projekt — pojawi się od razu na stronie.">
          <Link href="/panel/admin/portfolio/nowy" className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[13.5px] font-medium text-bg">
            Dodaj projekt
          </Link>
        </Empty>
      </Card>
    );

  const stats = [
    { label: "Projekty", v: items.length },
    { label: "Widoczne", v: items.filter((p) => p.published).length },
    { label: "Na stronie głównej", v: Math.min(6, items.filter((p) => p.published && p.featured).length) },
    { label: "Odsłony · 30 dni", v: totalViews },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.7, ease }} className="edge rounded-[20px] bg-surface/80 p-4 sm:p-5">
            <p className="text-[12.5px] text-dim">{s.label}</p>
            <p className="mt-2 text-[28px] tracking-[-0.02em] tabular-nums">{s.v.toLocaleString("pl-PL")}</p>
          </motion.div>
        ))}
      </div>

      <Card pad={false}>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:p-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]" data-lenis-prevent>
            {[{ id: "all", name: "Wszystkie" }, ...services].map((s) => (
              <button key={s.id} type="button" onClick={() => setCat(s.id as ServiceId | "all")} className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] transition-colors ${cat === s.id ? "bg-white/[0.08] text-ink" : "text-muted hover:text-ink"}`}>
                {s.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <div className="relative min-w-0 basis-full sm:basis-auto sm:flex-1 2xl:w-56">
              <Icon d={ICONS.search} className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-dim" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj projektu…" className={`${field} h-10 pl-9`} />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={`${field} h-10 min-w-0 flex-1 bg-surface sm:w-auto sm:flex-none`} aria-label="Status">
              <option value="all">Każdy status</option>
              <option value="visible">Widoczne</option>
              <option value="hidden">Ukryte</option>
              <option value="featured">Na głównej</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-3 text-[12.5px] text-dim">
          <span>{filtering ? `${filtered.length} z ${items.length} · zmiana kolejności tylko bez filtrów` : "Przeciągnij, aby zmienić kolejność · 6 pierwszych wyróżnionych jest na stronie głównej"}</span>
          <AnimatePresence>
            {saved && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-emerald-300">
                Zapisano kolejność ✓
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <Reorder.Group axis="y" values={filtering ? filtered : items} onReorder={filtering ? () => {} : setItems} className="divide-y divide-line border-t border-line" as="ul">
          {(filtering ? filtered : items).map((p, i) => {
            const v = views[p.slug];
            const onHome = !filtering && p.published && p.featured && items.filter((x) => x.published && x.featured).indexOf(p) < 6;
            return (
              <Reorder.Item
                key={p.id}
                value={p}
                dragListener={!filtering}
                className="relative bg-surface px-3 py-3 sm:px-5"
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
                    <span className="cursor-grab touch-none text-dim active:cursor-grabbing" aria-label="Przeciągnij">
                      <Icon d={ICONS.drag} />
                    </span>
                  )}
                  <span className="hidden w-5 text-[12px] text-dim tabular-nums sm:block">{String(i + 1).padStart(2, "0")}</span>
                  <span className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5 sm:h-16 sm:w-24 ${p.published ? "" : "opacity-50 grayscale"}`}>
                    <Image src={p.image} alt="" fill sizes="96px" className="pointer-events-none object-cover object-top" />
                    {onHome && <span className="absolute top-1 left-1 size-1.5 rounded-full bg-accent-2 shadow-[0_0_8px_#b4a2ff]" title="Na stronie głównej" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px]">{p.name}</span>
                    <span className="block truncate text-[12.5px] text-dim">
                      {serviceName(p.category)} · {p.client} · {p.year}
                    </span>
                    <span className="mt-1.5 hidden items-center gap-2 sm:flex">
                      <span className="h-1 w-24 overflow-hidden rounded-full bg-white/[0.06]">
                        <span className="block h-full rounded-full bg-accent" style={{ width: `${((v?.views ?? 0) / maxViews) * 100}%` }} />
                      </span>
                      <span className="text-[11.5px] text-dim tabular-nums">{v ? `${v.views} odsłon · ${v.visitors} osób` : "brak odsłon"}</span>
                    </span>
                  </span>
                  <span className="hidden items-center gap-1.5 lg:flex">
                    <Pill on={p.published} tone="green" onClick={() => toggle(p, "published")}>
                      {p.published ? "Widoczny" : "Ukryty"}
                    </Pill>
                    <Pill on={p.featured} tone="accent" onClick={() => toggle(p, "featured")}>
                      {p.featured ? "★ Wyróżniony" : "☆ Wyróżnij"}
                    </Pill>
                  </span>
                  <span className="flex items-center">
                    <Link href={`/panel/admin/portfolio/${p.id}`} className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-white/5 hover:text-ink" aria-label="Edytuj">
                      <Icon d={ICONS.edit} className="size-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        start(async () => {
                          const r = await duplicateProject(p.id);
                          if (r.id) router.push(`/panel/admin/portfolio/${r.id}`);
                        })
                      }
                      className="hidden size-9 place-items-center rounded-full text-muted transition-colors hover:bg-white/5 hover:text-ink sm:grid"
                      aria-label="Duplikuj"
                      title="Duplikuj"
                    >
                      <Icon d={ICONS.copy} className="size-4" />
                    </button>
                    <a href={`/portfolio/${p.slug}`} target="_blank" className="hidden size-9 place-items-center rounded-full text-muted transition-colors hover:bg-white/5 hover:text-ink sm:grid" aria-label="Zobacz na stronie">
                      <Icon d={ICONS.eye} className="size-4" />
                    </a>
                    <ConfirmBtn onConfirm={() => start(async () => (await deleteProject(p.id), setItems((x) => x.filter((y) => y.id !== p.id))))} label="Usunąć?">
                      <span className="sr-only">Usuń</span>
                    </ConfirmBtn>
                  </span>
                </div>
                {/* telefon / tablet: przełączniki pod spodem */}
                <div className="mt-2.5 flex gap-1.5 pl-[76px] sm:pl-[136px] lg:hidden">
                  <Pill on={p.published} tone="green" onClick={() => toggle(p, "published")}>
                    {p.published ? "Widoczny" : "Ukryty"}
                  </Pill>
                  <Pill on={p.featured} tone="accent" onClick={() => toggle(p, "featured")}>
                    {p.featured ? "★ Wyróżniony" : "☆ Wyróżnij"}
                  </Pill>
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
        {filtering && !filtered.length && <p className="px-5 py-10 text-center text-[13.5px] text-dim">Nic nie pasuje do filtrów.</p>}
      </Card>
    </div>
  );
}
