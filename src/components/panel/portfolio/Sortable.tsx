"use client";

import { Reorder, useDragControls } from "motion/react";
import { ICONS, Icon } from "../kit";

/*
 * Lista z ręczną kolejnością: przeciąganie za uchwyt (działa też na telefonie, nie blokuje przewijania)
 * albo strzałki w górę / w dół. Rodzic zapisuje kolejność po upuszczeniu lub kliknięciu strzałki.
 */

export const moveItem = <T,>(list: T[], from: number, to: number) => {
  if (to < 0 || to >= list.length || from === to) return list;
  const a = [...list];
  a.splice(to, 0, a.splice(from, 1)[0]);
  return a;
};

export function SortItem<T>({ value, onDrop, className = "", children }: { value: T; onDrop: () => void; className?: string; children: (handle: React.ReactNode) => React.ReactNode }) {
  const controls = useDragControls();
  const handle = (
    <button
      type="button"
      aria-label="Przeciągnij, by zmienić kolejność"
      title="Przeciągnij, by zmienić kolejność"
      onPointerDown={(e) => {
        e.preventDefault();
        controls.start(e);
      }}
      className="grid size-9 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-dim transition-colors hover:bg-white/[0.06] hover:text-ink active:cursor-grabbing"
    >
      <Icon d={ICONS.drag} />
    </button>
  );
  return (
    <Reorder.Item
      as="li"
      value={value}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDrop}
      className={`relative ${className}`}
      whileDrag={{ scale: 1.012, zIndex: 20, boxShadow: "0 24px 60px -24px rgb(0 0 0 / 0.9), 0 0 0 1px rgb(139 108 255 / 0.35)" }}
    >
      {children(handle)}
    </Reorder.Item>
  );
}

export function MoveButtons({ index, count, onMove }: { index: number; count: number; onMove: (to: number) => void }) {
  const btn = "grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-ink disabled:pointer-events-none disabled:opacity-25";
  return (
    <span className="flex shrink-0 items-center">
      <button type="button" onClick={() => onMove(index - 1)} disabled={index === 0} className={btn} aria-label="Wyżej" title="Wyżej">
        <Icon d={ICONS.arrowUp} className="size-4" />
      </button>
      <button type="button" onClick={() => onMove(index + 1)} disabled={index === count - 1} className={btn} aria-label="Niżej" title="Niżej">
        <Icon d={ICONS.arrowUp} className="size-4 rotate-180" />
      </button>
    </span>
  );
}
