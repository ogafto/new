"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Reorder } from "motion/react";
import { deleteProject, reorderProjects, toggleProject } from "@/app/panel/admin/portfolio/actions";
import type { AdminProject } from "@/lib/projects";
import { serviceName } from "@/lib/site";
import { Badge, Card, ConfirmBtn, Empty, ICONS, Icon } from "./kit";

export default function ProjectList({ projects }: { projects: AdminProject[] }) {
  const [items, setItems] = useState(projects);
  const [, start] = useTransition();
  const [saved, setSaved] = useState(false);

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

  return (
    <Card pad={false}>
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5 text-[13px] text-dim">
        <span>Przeciągnij, żeby zmienić kolejność. Pierwsze 6 wyróżnionych trafia na stronę główną.</span>
        {saved && <span className="text-emerald-300">Zapisano kolejność ✓</span>}
      </div>
      <Reorder.Group
        axis="y"
        values={items}
        onReorder={setItems}
        className="divide-y divide-line"
        as="ul"
      >
        {items.map((p, i) => (
          <Reorder.Item
            key={p.id}
            value={p}
            className="relative flex items-center gap-3 bg-surface px-3 py-3 sm:gap-4 sm:px-5"
            whileDrag={{ scale: 1.01, boxShadow: "0 20px 50px -20px rgba(0,0,0,0.8)", zIndex: 10 }}
            onDragEnd={() =>
              start(async () => {
                await reorderProjects(items.map((x) => x.id));
                setSaved(true);
                setTimeout(() => setSaved(false), 1800);
              })
            }
          >
            <span className="cursor-grab text-dim active:cursor-grabbing" aria-label="Przeciągnij">
              <Icon d={ICONS.drag} />
            </span>
            <span className="hidden w-5 text-[12px] text-dim tabular-nums sm:block">{String(i + 1).padStart(2, "0")}</span>
            <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5 sm:h-16 sm:w-24">
              <Image src={p.image} alt="" fill sizes="96px" className="pointer-events-none object-cover object-top" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px]">{p.name}</span>
              <span className="block truncate text-[12.5px] text-dim">
                {serviceName(p.category)} · {p.client} · {p.year}
              </span>
            </span>
            <span className="hidden items-center gap-1.5 md:flex">
              <button type="button" onClick={() => start(async () => (await toggleProject(p.id, "published"), setItems((x) => x.map((y) => (y.id === p.id ? { ...y, published: !y.published } : y)))))}>
                <Badge tone={p.published ? "green" : "default"}>{p.published ? "Widoczny" : "Ukryty"}</Badge>
              </button>
              <button type="button" onClick={() => start(async () => (await toggleProject(p.id, "featured"), setItems((x) => x.map((y) => (y.id === p.id ? { ...y, featured: !y.featured } : y)))))}>
                <Badge tone={p.featured ? "accent" : "default"}>{p.featured ? "★ Na głównej" : "☆ Wyróżnij"}</Badge>
              </button>
            </span>
            <span className="flex items-center gap-1">
              <Link href={`/panel/admin/portfolio/${p.id}`} className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-white/5 hover:text-ink" aria-label="Edytuj">
                <Icon d={ICONS.edit} className="size-4" />
              </Link>
              <a href={`/portfolio/${p.slug}`} target="_blank" className="hidden size-9 place-items-center rounded-full text-muted transition-colors hover:bg-white/5 hover:text-ink sm:grid" aria-label="Zobacz na stronie">
                <Icon d={ICONS.site} className="size-4" />
              </a>
              <ConfirmBtn onConfirm={() => start(async () => (await deleteProject(p.id), setItems((x) => x.filter((y) => y.id !== p.id))))} label="Usunąć?">
                <span className="sr-only">Usuń</span>
              </ConfirmBtn>
            </span>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </Card>
  );
}
