"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, Reorder } from "motion/react";
import {
  reorderCategories,
  saveCategory,
  toggleCategory,
} from "@/app/panel/admin/portfolio/actions";
import type { AdminCategory } from "@/lib/projects";
import { plural } from "@/lib/format";
import { Alert } from "../../account/ui";
import {
  Btn,
  Card,
  Count,
  ease,
  Empty,
  field,
  ICONS,
  Icon,
  Label,
  Modal,
} from "../kit";
import Media from "../../ui/Media";
import { MoveButtons, moveItem, SortItem } from "./Sortable";

type Views = Record<string, number>;

const works = (n: number) => `${n} ${plural(n, "praca", "prace", "prac")}`;

// Okno „Nowa kategoria”: nazwa (+ opis) → od razu przejście do kategorii, gdzie wrzucasz prace
export function NewCategory({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveCategory, undefined);
  useEffect(() => {
    if (state?.ok && state.id)
      router.push(`/panel/admin/portfolio/kategoria/${state.id}`);
  }, [state, router]);
  return (
    <Modal open={open} onClose={onClose} title="Nowa kategoria">
      <form action={action} className="space-y-4">
        <Label
          label="Nazwa"
          hint="Np. Logo, Banery Minecraft, Strony internetowe. Nowa kategoria pojawi się na stronie jako pierwsza."
        >
          <input
            name="name"
            required
            autoFocus
            maxLength={60}
            className={`${field} h-12 text-[16px]`}
            placeholder="Logo"
          />
        </Label>
        <Label
          label="Opis"
          hint="Opcjonalnie, jedno zdanie pod nazwą kategorii."
        >
          <textarea
            name="description"
            rows={2}
            maxLength={400}
            className={`${field} resize-none py-3`}
          />
        </Label>
        <Alert>{state?.error}</Alert>
        <div className="flex justify-end gap-2 pt-1">
          <Btn type="button" variant="ghost" onClick={onClose}>
            Anuluj
          </Btn>
          <Btn
            type="submit"
            variant="primary"
            icon={ICONS.check}
            disabled={pending}
          >
            {pending ? "Tworzę…" : "Utwórz kategorię"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

export default function CategoryBoard({
  categories,
  views,
}: {
  categories: AdminCategory[];
  views: Views;
}) {
  const [items, setItems] = useState(categories);
  const order = useRef(categories); // aktualna kolejność dla zapisu po upuszczeniu
  useEffect(() => {
    order.current = items;
  }, [items]);
  const [creating, setCreating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [, start] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => setItems(categories), 0);
    return () => clearTimeout(t);
  }, [categories]);

  const total = items.reduce((a, c) => a + c.count, 0);
  const visible = items.filter(
    (c) => c.published && c.count - c.hidden > 0,
  ).length;
  const allViews = Object.values(views).reduce((a, v) => a + v, 0);

  const persist = (list: AdminCategory[]) =>
    start(async () => {
      await reorderCategories(list.map((x) => x.id));
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });
  const moveTo = (from: number, to: number) => {
    const a = moveItem(items, from, to);
    if (a === items) return;
    setItems(a);
    persist(a);
  };

  const toggle = (c: AdminCategory) =>
    start(async () => {
      setItems((x) =>
        x.map((y) => (y.id === c.id ? { ...y, published: !y.published } : y)),
      );
      await toggleCategory(c.id);
    });

  const head = (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
      <p className="text-[12.5px] text-dim">
        Kolejność jak w pokazie na stronie głównej, od góry. Przeciągnij za
        uchwyt albo użyj strzałek. Pusta lub ukryta kategoria się nie pokazuje.
      </p>
      <AnimatePresence>
        {saved && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-[12.5px] text-emerald-300"
          >
            <Icon d={ICONS.check} className="size-3.5" /> Zapisano kolejność
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="space-y-4">
      <NewCategory open={creating} onClose={() => setCreating(false)} />

      <motion.div
        className="grid grid-cols-3 gap-px overflow-hidden rounded-[22px] border border-white/[0.07] bg-white/[0.06]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
      >
        {[
          { label: "Kategorie na stronie", v: visible, icon: ICONS.grid },
          { label: "Prace", v: total, icon: ICONS.layers },
          {
            label: "Wejścia w portfolio · 30 dni",
            v: allViews,
            icon: ICONS.eye,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="group bg-[rgb(13_13_18/0.92)] p-4 sm:p-5"
          >
            <p className="flex items-center gap-2 text-[12.5px] text-dim">
              <Icon
                d={s.icon}
                className="size-3.5 shrink-0 transition-colors group-hover:text-accent-2"
              />
              <span className="truncate">{s.label}</span>
            </p>
            <Count
              value={s.v}
              className="h-display mt-2 block text-[28px] leading-none sm:text-[32px]"
            />
          </div>
        ))}
      </motion.div>

      {!items.length ? (
        <Card>
          <Empty
            icon={ICONS.grid}
            title="Nie masz jeszcze kategorii"
            text="Utwórz pierwszą (np. Logo), a potem wrzuć do niej prace. Pojawią się od razu na stronie."
          >
            <Btn
              type="button"
              variant="primary"
              icon={ICONS.plus}
              onClick={() => setCreating(true)}
            >
              Nowa kategoria
            </Btn>
          </Empty>
        </Card>
      ) : (
        <>
          {head}
          <Card pad={false}>
            <Reorder.Group
              axis="y"
              values={items}
              onReorder={setItems}
              as="ul"
              className="divide-y divide-white/[0.06]"
            >
              {items.map((c, i) => {
                const shown = c.count - c.hidden;
                const live = c.published && shown > 0;
                return (
                  <SortItem
                    key={c.id}
                    value={c}
                    onDrop={() => persist(order.current)}
                    className="group bg-[rgb(15_15_20)] transition-colors hover:bg-[rgb(19_19_26)]"
                  >
                    {(handle) => (
                      <div className="flex items-center gap-2 px-2 py-3 sm:gap-4 sm:px-4">
                        {handle}
                        <span className="hidden w-5 text-[12px] text-dim tabular-nums sm:block">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <Link
                          href={`/panel/admin/portfolio/kategoria/${c.id}`}
                          className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/[0.06] sm:h-16 sm:w-24 ${live ? "" : "opacity-50 grayscale"}`}
                          aria-label={`Otwórz ${c.name}`}
                        >
                          {c.image ? (
                            <Media
                              src={c.image}
                              fill
                              sizes="96px"
                              className="pointer-events-none object-cover"
                            />
                          ) : (
                            <Icon
                              d={ICONS.grid}
                              className="absolute inset-0 m-auto size-5 text-dim"
                            />
                          )}
                        </Link>
                        <Link
                          href={`/panel/admin/portfolio/kategoria/${c.id}`}
                          className="min-w-0 flex-1"
                        >
                          <span className="block truncate text-[16px] font-medium tracking-[-0.01em] transition-colors group-hover:text-accent-2">
                            {c.name}
                          </span>
                          <span className="block truncate text-[12.5px] text-dim">
                            {works(c.count)}
                            {c.hidden > 0 && ` · ${c.hidden} ukryte`}
                            {views[c.slug] ? ` · ${views[c.slug]} wejść` : ""}
                          </span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggle(c)}
                          className={`hidden h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[12px] whitespace-nowrap transition-colors sm:inline-flex ${c.published ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-line-2 text-dim hover:text-ink"}`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${c.published ? "bg-emerald-400" : "bg-white/30"}`}
                          />
                          {c.published
                            ? shown
                              ? "Na stronie"
                              : "Pusta"
                            : "Ukryta"}
                        </button>
                        <MoveButtons
                          index={i}
                          count={items.length}
                          onMove={(to) => moveTo(i, to)}
                        />
                        <Link
                          href={`/panel/admin/portfolio/kategoria/${c.id}`}
                          className="hidden size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-ink sm:grid"
                          aria-label="Otwórz"
                        >
                          <Icon
                            d={ICONS.arrowUp}
                            className="size-4 rotate-90"
                          />
                        </Link>
                      </div>
                    )}
                  </SortItem>
                );
              })}
            </Reorder.Group>
          </Card>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="group flex h-16 w-full items-center justify-center gap-3 rounded-[22px] border border-dashed border-white/[0.1] text-[14px] text-muted transition-colors hover:border-accent/40 hover:bg-accent/[0.04] hover:text-ink"
          >
            <span className="grid size-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-accent-2 transition-transform duration-500 ease-out-expo group-hover:rotate-90">
              <Icon d={ICONS.plus} className="size-4" />
            </span>
            Nowa kategoria
          </button>
        </>
      )}
    </div>
  );
}
