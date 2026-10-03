"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { saveSettings, testConnection, type SaveResult } from "@/app/panel/admin/ustawienia/actions";
import type { SettingGroup, SettingState } from "@/lib/settings";
import { Badge, Btn, ease, field, Icon, ICONS } from "./kit";
import { FieldRow, Note, SectionCard, SectionNav, type NavItem, type NavStatus } from "./settings/SectionNav";

type Def = { key: string; group: SettingGroup; label: string; hint?: string; placeholder?: string; secret?: boolean; env: string; type?: string };
type Props = {
  groups: { id: SettingGroup; title: string; text: string }[];
  defs: Def[];
  states: SettingState[];
  webhookUrl: string;
  envOnly: { key: string; label: string; set: boolean }[];
  secretKey: boolean;
};

const GROUP_ICON: Record<SettingGroup, string> = {
  general: ICONS.globe,
  mail: ICONS.mail,
  discord: ICONS.inbox,
  stripe: ICONS.card,
  analytics: ICONS.chart,
  storage: ICONS.upload,
};
const TESTS: Partial<Record<SettingGroup, "mail" | "discord" | "stripe">> = { mail: "mail", discord: "discord", stripe: "stripe" };
const EYE_OFF = "M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.4 10.4 0 0112 5c6.5 0 10 7 10 7a17.6 17.6 0 01-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.8 9.8 0 005.4-1.6";
const ENV_ICON = "M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16";

const statusOf = (defs: Def[], states: SettingState[]): NavStatus => {
  const filled = defs.filter((d) => {
    const s = states.find((x) => x.key === d.key);
    return s && s.source !== "none" && !s.broken;
  }).length;
  return filled === defs.length ? "ok" : filled ? "part" : "none";
};

function CopyBtn({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard.writeText(value).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        })
      }
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] transition-colors ${done ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-line-2 text-muted hover:border-white/30 hover:text-ink"}`}
    >
      <Icon d={done ? ICONS.check : ICONS.copy} className="size-3.5" />
      {done ? "Skopiowano" : "Kopiuj"}
    </button>
  );
}

/* Sekret: zamaskowany podgląd → „Zmień” otwiera pole (z podglądem wpisywanej wartości) */
function SecretField({ d, s, value, onChange, removing, onRemove }: { d: Def; s: SettingState; value: string; onChange: (v: string) => void; removing: boolean; onRemove?: () => void }) {
  const [edit, setEdit] = useState(!s.preview || !!s.broken);
  const [show, setShow] = useState(false);

  if (!edit)
    return (
      <div className={`flex h-11 items-center gap-2 rounded-xl border border-line-2 bg-white/[0.02] pr-1.5 pl-3.5 transition-opacity ${removing ? "opacity-60" : ""}`}>
        <Icon d={ICONS.key} className="size-3.5 shrink-0 text-dim" />
        <code className={`min-w-0 flex-1 truncate font-mono text-[13px] tracking-wide ${removing ? "text-red-200/80 line-through" : "text-muted"}`}>{s.preview}</code>
        {onRemove && (
          <button type="button" onClick={onRemove} className={`h-8 shrink-0 rounded-lg px-2.5 text-[12.5px] transition-colors ${removing ? "bg-red-400/10 text-red-200" : "text-dim hover:bg-red-400/10 hover:text-red-200"}`}>
            {removing ? "Cofnij" : "Usuń"}
          </button>
        )}
        {!removing && (
          <button type="button" onClick={() => setEdit(true)} className="h-8 shrink-0 rounded-lg border border-line-2 px-3 text-[12.5px] text-ink transition-colors hover:border-white/30 hover:bg-white/[0.04]">
            Zmień
          </button>
        )}
      </div>
    );

  return (
    <div className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <input
          id={`s-${d.key}`}
          type={show ? "text" : "password"}
          autoComplete="off"
          spellCheck={false}
          autoFocus={!!s.preview}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={d.placeholder}
          className={`${field} h-11 pr-11 font-mono text-[13px]`}
        />
        <button type="button" onClick={() => setShow((x) => !x)} className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-dim transition-colors hover:text-ink" aria-label={show ? "Ukryj" : "Pokaż"}>
          <Icon d={show ? EYE_OFF : ICONS.eye} className="size-4" />
        </button>
      </div>
      {s.preview && !s.broken && (
        <Btn
          type="button"
          size="sm"
          variant="ghost"
          className="!h-11"
          onClick={() => {
            onChange("");
            setEdit(false);
          }}
        >
          Anuluj
        </Btn>
      )}
    </div>
  );
}

function Group({ g, defs, states, webhookUrl, delay }: { g: Props["groups"][number]; defs: Def[]; states: SettingState[]; webhookUrl: string; delay: number }) {
  const router = useRouter();
  const st = (k: string) => states.find((s) => s.key === k)!;
  const initial = () => Object.fromEntries(defs.map((d) => [d.key, d.secret ? "" : st(d.key)?.source === "panel" ? st(d.key).preview : ""]));
  const [base, setBase] = useState<Record<string, string>>(initial);
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [clear, setClear] = useState<string[]>([]);
  const [result, setResult] = useState<SaveResult>();
  const [saving, startSave] = useTransition();
  const [testing, startTest] = useTransition();
  const status = statusOf(defs, states);
  const test = TESTS[g.id];
  const dirty = clear.length > 0 || defs.some((d) => (values[d.key] ?? "") !== (base[d.key] ?? ""));

  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setResult(undefined), 6000);
    return () => clearTimeout(t);
  }, [result]);

  return (
    <SectionCard
      id={`g-${g.id}`}
      icon={GROUP_ICON[g.id]}
      title={g.title}
      text={g.text}
      delay={delay}
      badge={<Badge tone={status === "ok" ? "green" : status === "part" ? "amber" : "default"}>{status === "ok" ? "Skonfigurowane" : status === "part" ? "Częściowo" : "Nieustawione"}</Badge>}
      footer={
        <>
          <div className="min-h-5 min-w-0 flex-1">
            <AnimatePresence mode="wait">
              {result && (result.ok || result.error) ? (
                <Note key="r" ok={result.ok} error={result.error} />
              ) : dirty ? (
                <motion.p key="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-[13px] text-amber-200/90">
                  <span className="size-1.5 rounded-full bg-amber-300" /> Niezapisane zmiany
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>
          <div className="flex shrink-0 gap-2">
            {test && (
              <Btn type="button" size="sm" icon={ICONS.refresh} disabled={testing || status === "none"} onClick={() => startTest(async () => setResult(await testConnection(test)))}>
                {testing ? "Sprawdzam…" : test === "mail" ? "Wyślij test" : "Test połączenia"}
              </Btn>
            )}
            <Btn type="submit" form={`f-${g.id}`} variant="primary" size="sm" icon={ICONS.check} disabled={saving || !dirty} className="min-w-[96px]">
              {saving ? "Zapisuję…" : "Zapisz"}
            </Btn>
          </div>
        </>
      }
    >
      <form
        id={`f-${g.id}`}
        className="divide-y divide-white/[0.05]"
        onSubmit={(e) => {
          e.preventDefault();
          startSave(async () => {
            const r = await saveSettings(g.id, values, clear);
            setResult(r);
            if (r?.ok) {
              setClear([]);
              const next = Object.fromEntries(Object.entries(values).map(([k, x]) => [k, defs.find((d) => d.key === k)?.secret ? "" : x]));
              setValues(next);
              setBase(next);
              router.refresh();
            }
          });
        }}
      >
        {defs.map((d) => {
          const s = st(d.key);
          const removing = clear.includes(d.key);
          const src = s.broken ? (
            <Badge tone="red">wpisz ponownie</Badge>
          ) : s.source === "panel" ? (
            <span className="rounded-md bg-emerald-400/10 px-1.5 py-px text-[11px] text-emerald-200/90">panel</span>
          ) : s.source === "env" ? (
            <span className="rounded-md bg-white/[0.05] px-1.5 py-px font-mono text-[10.5px] text-dim" title={`Ze zmiennej ${d.env}`}>
              env
            </span>
          ) : null;
          return (
            <FieldRow key={d.key} label={d.label} htmlFor={`s-${d.key}`} hint={d.hint} aside={src}>
              {d.secret ? (
                <SecretField
                  key={`${s.source}-${s.updatedAt ?? 0}-${s.preview}`}
                  d={d}
                  s={s}
                  value={values[d.key] ?? ""}
                  onChange={(v) => setValues((x) => ({ ...x, [d.key]: v }))}
                  removing={removing}
                  onRemove={s.source === "panel" ? () => setClear((c) => (c.includes(d.key) ? c.filter((x) => x !== d.key) : [...c, d.key])) : undefined}
                />
              ) : (
                <input
                  id={`s-${d.key}`}
                  type={d.type === "email" ? "email" : d.type === "url" ? "url" : "text"}
                  autoComplete="off"
                  spellCheck={false}
                  value={values[d.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [d.key]: e.target.value }))}
                  placeholder={s.source === "env" ? s.preview : d.placeholder}
                  className={`${field} h-11 text-[14px]`}
                />
              )}
            </FieldRow>
          );
        })}

        {g.id === "stripe" && (
          <FieldRow label="Adres webhooka" hint="Wklej w Stripe → Webhooks.">
            <div className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/[0.05] p-1 pl-3.5">
              <Icon d={ICONS.link} className="size-3.5 shrink-0 text-accent-2" />
              <code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-accent-2">{webhookUrl}</code>
              <CopyBtn value={webhookUrl} />
            </div>
          </FieldRow>
        )}
      </form>
    </SectionCard>
  );
}

function EnvCard({ envOnly, secretKey, delay }: { envOnly: Props["envOnly"]; secretKey: boolean; delay: number }) {
  const set = envOnly.filter((e) => e.set).length;
  return (
    <SectionCard id="g-env" icon={ENV_ICON} title="Zmienne środowiskowe" text="Ustawiane w Vercelu, tylko do odczytu." delay={delay} badge={<Badge tone={set === envOnly.length ? "green" : "default"}>{`${set}/${envOnly.length}`}</Badge>}>
      <ul className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-2">
        {envOnly.map((e) => (
          <li key={e.key} className="flex min-w-0 items-center gap-3 bg-[rgb(14_14_19)] px-4 py-3">
            <span className={`size-1.5 shrink-0 rounded-full ${e.set ? "bg-emerald-400 shadow-[0_0_8px_rgb(52_211_153/0.7)]" : "bg-white/20"}`} />
            <span className="min-w-0 flex-1">
              <span className={`block truncate font-mono text-[12px] ${e.set ? "text-ink" : "text-dim"}`}>{e.key}</span>
              <span className="block truncate text-[11.5px] text-dim">{e.label}</span>
            </span>
            <span className={`shrink-0 text-[11.5px] ${e.set ? "text-emerald-300/80" : "text-dim"}`}>{e.set ? "ustawiona" : "brak"}</span>
          </li>
        ))}
      </ul>
      {!secretKey && (
        <p className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-300/15 bg-amber-300/[0.05] px-3.5 py-3 text-[12.5px] leading-relaxed text-amber-100/80">
          <Icon d={ICONS.shield} className="mt-px size-4 shrink-0 text-amber-200" />
          Dodaj SECRET_KEY — zmiana hasła admina nie wymaże wtedy zapisanych kluczy.
        </p>
      )}
    </SectionCard>
  );
}

export default function SettingsForm({ groups, defs, states, webhookUrl, envOnly, secretKey }: Props) {
  const [active, setActive] = useState<string>(groups[0]?.id ?? "env");

  // scroll-spy: aktywna jest ostatnia sekcja, której góra minęła linię pod nagłówkiem
  useEffect(() => {
    const ids = [...groups.map((g) => g.id), "env"];
    let raf = 0;
    const calc = () => {
      raf = 0;
      const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
      let cur = ids[0];
      for (const id of ids) {
        const el = document.getElementById(`g-${id}`);
        if (el && el.getBoundingClientRect().top <= 180) cur = id;
      }
      setActive(atEnd ? ids[ids.length - 1] : cur);
    };
    const on = () => (raf ||= requestAnimationFrame(calc));
    addEventListener("scroll", on, { passive: true });
    return () => {
      removeEventListener("scroll", on);
      cancelAnimationFrame(raf);
    };
  }, [groups]);

  const items: NavItem[] = [
    ...groups.map((g) => ({ id: g.id, label: g.title.replace(/ \(.+\)$/, ""), icon: GROUP_ICON[g.id], status: statusOf(defs.filter((d) => d.group === g.id), states) })),
    { id: "env", label: "Środowisko", icon: ENV_ICON, status: (envOnly.every((e) => e.set) ? "ok" : "part") as NavStatus },
  ];
  const ok = items.slice(0, -1).filter((i) => i.status === "ok").length;

  const pick = (id: string) => {
    setActive(id);
    document.getElementById(`g-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-x-8 lg:grid-cols-[212px_minmax(0,1fr)]">
      <SectionNav
        id="settings"
        items={items}
        active={active}
        onPick={pick}
        footer={
          <div className="px-3">
            <div className="flex items-baseline justify-between text-[12px]">
              <span className="text-dim">Integracje</span>
              <span className="text-muted tabular-nums">
                {ok}/{groups.length}
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2" initial={{ width: 0 }} animate={{ width: `${(ok / Math.max(1, groups.length)) * 100}%` }} transition={{ delay: 0.3, duration: 0.9, ease }} />
            </div>
          </div>
        }
      />
      <div className="min-w-0 space-y-4">
        {groups.map((g, i) => (
          <Group key={g.id} g={g} defs={defs.filter((d) => d.group === g.id)} states={states} webhookUrl={webhookUrl} delay={0.04 * i} />
        ))}
        <EnvCard envOnly={envOnly} secretKey={secretKey} delay={0.28} />
      </div>
    </div>
  );
}
