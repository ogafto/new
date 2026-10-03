"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { saveSettings, testConnection, type SaveResult } from "@/app/panel/admin/ustawienia/actions";
import type { SettingGroup, SettingState } from "@/lib/settings";
import { Badge, Btn, Card, ease, field, Icon, ICONS } from "./kit";

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

function Result({ r }: { r: SaveResult }) {
  return (
    <AnimatePresence mode="wait">
      {r && (r.ok || r.error) && (
        <motion.p
          key={(r.ok ?? "") + (r.error ?? "")}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`rounded-xl border px-3.5 py-2.5 text-[13px] ${r.error ? "border-red-400/25 bg-red-400/10 text-red-200" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"}`}
        >
          {r.error ?? r.ok}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function Copy({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
      className="grid size-9 shrink-0 place-items-center rounded-lg border border-line-2 text-muted transition-colors hover:text-ink"
      aria-label="Kopiuj"
    >
      <Icon d={done ? ICONS.check : ICONS.copy} className="size-4" />
    </button>
  );
}

function Group({ g, defs, states, webhookUrl, delay }: { g: Props["groups"][number]; defs: Def[]; states: SettingState[]; webhookUrl: string; delay: number }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(defs.map((d) => [d.key, d.secret ? "" : (states.find((s) => s.key === d.key)?.source === "panel" ? states.find((s) => s.key === d.key)!.preview : "")])));
  const [clear, setClear] = useState<string[]>([]);
  const [result, setResult] = useState<SaveResult>();
  const [saving, startSave] = useTransition();
  const [testing, startTest] = useTransition();
  const st = (k: string) => states.find((s) => s.key === k)!;
  const filled = defs.filter((d) => st(d.key).source !== "none" && !st(d.key).broken).length;
  const status = filled === defs.length ? "ok" : filled ? "part" : "none";
  const test = TESTS[g.id];

  return (
    <Card delay={delay} className="flex flex-col">
      <div className="mb-5 flex items-start gap-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-accent-2">
          <Icon d={GROUP_ICON[g.id]} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[16px] font-medium">{g.title}</h2>
            <Badge tone={status === "ok" ? "green" : status === "part" ? "amber" : "default"}>{status === "ok" ? "Skonfigurowane" : status === "part" ? "Częściowo" : "Nieustawione"}</Badge>
          </div>
        </div>
      </div>

      <form
        className="flex flex-1 flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          startSave(async () => {
            const r = await saveSettings(g.id, values, clear);
            setResult(r);
            if (r?.ok) {
              setClear([]);
              setValues((v) => Object.fromEntries(Object.entries(v).map(([k, x]) => [k, defs.find((d) => d.key === k)?.secret ? "" : x])));
              router.refresh();
            }
          });
        }}
      >
        {defs.map((d) => {
          const s = st(d.key);
          const removing = clear.includes(d.key);
          return (
            <div key={d.key}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label htmlFor={`s-${d.key}`} className="text-[13px] text-muted">
                  {d.label}
                </label>
                {s.broken ? (
                  <Badge tone="red">wpisz ponownie</Badge>
                ) : s.source === "panel" ? (
                  <span className="text-[11.5px] text-emerald-300/80">zapisane w panelu</span>
                ) : s.source === "env" ? (
                  <span className="text-[11.5px] text-dim" title={`Ze zmiennej ${d.env}`}>
                    z env · {d.env}
                  </span>
                ) : null}
              </div>
              <div className="flex gap-2">
                <input
                  id={`s-${d.key}`}
                  type={d.secret ? "password" : d.type === "email" ? "email" : d.type === "url" ? "url" : "text"}
                  autoComplete="off"
                  spellCheck={false}
                  disabled={removing}
                  value={values[d.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [d.key]: e.target.value }))}
                  placeholder={d.secret && s.preview ? `${s.preview} — wpisz nowy, żeby zmienić` : (s.source === "env" ? s.preview : d.placeholder)}
                  className={`${field} h-11 min-w-0 font-mono text-[13.5px] ${removing ? "line-through opacity-50" : ""}`}
                />
                {d.secret && s.source === "panel" && (
                  <button
                    type="button"
                    onClick={() => setClear((c) => (c.includes(d.key) ? c.filter((x) => x !== d.key) : [...c, d.key]))}
                    className={`grid size-11 shrink-0 place-items-center rounded-xl border transition-colors ${removing ? "border-red-400/40 bg-red-400/10 text-red-200" : "border-line-2 text-dim hover:text-red-200"}`}
                    aria-label={removing ? "Cofnij usuwanie" : "Usuń z panelu"}
                    title={removing ? "Cofnij" : "Usuń z panelu"}
                  >
                    <Icon d={removing ? ICONS.refresh : ICONS.trash} className="size-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {g.id === "stripe" && (
          <div className="rounded-2xl border border-line bg-white/[0.02] p-3.5">
            <p className="text-[12.5px] text-muted">Webhook Stripe</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-black/30 px-3 py-2 text-[12.5px] text-accent-2">{webhookUrl}</code>
              <Copy value={webhookUrl} />
            </div>
          </div>
        )}

        <div className="mt-auto space-y-3 pt-2">
          <Result r={result} />
          <div className="flex flex-wrap gap-2">
            <Btn type="submit" variant="primary" icon={ICONS.check} disabled={saving}>
              {saving ? "Zapisywanie…" : "Zapisz"}
            </Btn>
            {test && (
              <Btn type="button" icon={ICONS.refresh} disabled={testing || status === "none"} onClick={() => startTest(async () => setResult(await testConnection(test)))}>
                {testing ? "Sprawdzam…" : test === "mail" ? "Wyślij test" : "Sprawdź połączenie"}
              </Btn>
            )}
          </div>
        </div>
      </form>
    </Card>
  );
}

export default function SettingsForm({ groups, defs, states, webhookUrl, envOnly, secretKey }: Props) {
  return (
    <div className="space-y-4">
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0" data-lenis-prevent>
        {groups.map((g) => {
          const ds = defs.filter((d) => d.group === g.id);
          const set = ds.filter((d) => {
            const st = states.find((x) => x.key === d.key);
            return st && st.source !== "none" && !st.broken;
          }).length;
          return (
            <a key={g.id} href={`#g-${g.id}`} className="flex shrink-0 items-center gap-2 rounded-full border border-line-2 px-3.5 py-2 text-[13px] text-muted transition-colors hover:border-white/30 hover:text-ink">
              <span className={`size-1.5 rounded-full ${set === ds.length ? "bg-emerald-400" : set ? "bg-amber-300" : "bg-white/25"}`} />
              {g.title}
            </a>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((g, i) => (
          <div key={g.id} id={`g-${g.id}`} className="flex min-w-0 scroll-mt-24 flex-col [&>section]:flex-1">
            <Group g={g} defs={defs.filter((d) => d.group === g.id)} states={states} webhookUrl={webhookUrl} delay={0.04 * i} />
          </div>
        ))}
      </div>

      <Card delay={0.3}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <p className="flex shrink-0 items-center gap-2 text-[13.5px] text-muted">
            <Icon d={ICONS.key} className="size-4" /> Zmienne środowiskowe
          </p>
          <ul className="flex flex-wrap gap-1.5 lg:ml-auto">
            {envOnly.map((e) => (
              <li key={e.key} title={e.label} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11.5px] ${e.set ? "border-emerald-400/20 text-emerald-200/90" : "border-line-2 text-dim"}`}>
                <span className={`size-1.5 rounded-full ${e.set ? "bg-emerald-400" : "bg-white/25"}`} />
                {e.key}
              </li>
            ))}
          </ul>
        </div>
        {!secretKey && <p className="mt-3 text-[12px] text-dim">Dodaj SECRET_KEY w Vercelu — wtedy zmiana hasła admina nie wymaże zapisanych kluczy.</p>}
      </Card>
    </div>
  );
}
