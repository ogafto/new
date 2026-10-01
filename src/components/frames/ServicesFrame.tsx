"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { services, type Service } from "@/lib/site";
import { useCanvas } from "../canvas/CanvasProvider";

type Values = Record<string, number | boolean>;

const defaults = (s: Service): Values => Object.fromEntries(s.props.map((p) => [p.key, p.type === "select" ? 0 : false]));

const pln = (n: number) => `${n.toLocaleString("pl-PL")} zł`;

function Diamond({ className = "" }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" className={className} aria-hidden>
      <path d="M6 .5l2.4 2.4L6 5.3 3.6 2.9zM6 6.7l2.4 2.4L6 11.5 3.6 9.1zM2.9 3.6L5.3 6 2.9 8.4.5 6zM9.1 3.6L11.5 6 9.1 8.4 6.7 6z" fill="currentColor" />
    </svg>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-black/[0.03]">
      <span className="text-[13px] text-[#2c2c2e]">{label}</span>
      <span className={`relative h-[18px] w-[30px] rounded-full transition-colors ${on ? "bg-sel" : "bg-black/15"}`}>
        <motion.span className="absolute top-[2px] size-[14px] rounded-full bg-white shadow" animate={{ left: on ? 14 : 2 }} transition={{ type: "spring", stiffness: 600, damping: 35 }} />
      </span>
    </button>
  );
}

export default function ServicesFrame() {
  const { goToId, setPrefill } = useCanvas();
  const [sid, setSid] = useState(services[0].id);
  const service = services.find((s) => s.id === sid)!;
  const [values, setValues] = useState<Values>(() => defaults(services[0]));

  const pick = (id: string) => {
    setSid(id);
    setValues(defaults(services.find((s) => s.id === id)!));
  };

  const { total, lines } = useMemo(() => {
    const ls: { label: string; price: number }[] = [{ label: "Podstawa", price: service.base }];
    service.props.forEach((p) => {
      if (p.type === "select") {
        const o = p.options[values[p.key] as number];
        if (o?.price) ls.push({ label: `${p.label}: ${o.label}`, price: o.price });
      } else if (values[p.key]) ls.push({ label: p.label, price: p.price });
    });
    return { lines: ls, total: ls.reduce((a, b) => a + b.price, 0) };
  }, [service, values]);

  const send = () => {
    const parts = service.props.map((p) =>
      p.type === "select" ? `${p.label}: ${p.options[values[p.key] as number].label}` : values[p.key] ? p.label : null,
    );
    setPrefill(`${service.name} — ${parts.filter(Boolean).join(", ")} (szacunkowo od ${pln(total)})`);
    goToId("kontakt");
  };

  return (
    <div className="grid grid-cols-1 gap-8 p-6 sm:p-10 lg:h-full lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-14 lg:p-14">
      {/* podgląd instancji */}
      <div className="flex flex-col">
        <p className="fg-55 flex items-center gap-2 font-ui text-[13px] lg:text-[14px]">
          <Diamond className="text-comp" /> Komponent · Usługa
        </p>
        <h2 className="mt-3 font-display text-[42px] leading-[0.95] font-semibold tracking-[-0.045em] lg:text-[72px]" style={{ fontStretch: "104%" }}>
          Co mogę dla Ciebie zrobić
        </h2>

        <div className="relative mt-10 rounded-[14px] border-[1.5px] border-dashed border-comp/70 p-4 lg:mt-auto lg:p-5">
          <span className="absolute -top-[11px] left-5 flex items-center gap-1.5 bg-[#F7F7F5] px-1.5 font-ui text-[12px] font-medium text-comp">
            <Diamond /> Usługa
          </span>
          <AnimatePresence mode="wait">
            <motion.div
              key={sid}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="rounded-[8px] bg-white p-6 shadow-[0_1px_2px_rgb(0_0_0/0.06)] lg:p-8"
            >
              <p className="font-ui text-[12px] text-comp">Wariant = {service.short}</p>
              <h3 className="mt-2 font-display text-[32px] leading-none font-semibold tracking-[-0.04em] lg:text-[44px]">{service.name}</h3>
              <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-black/65 lg:text-[18px]">{service.description}</p>
              <ul className="mt-6 grid gap-x-8 gap-y-2.5 text-[15px] sm:grid-cols-2">
                {service.deliverables.map((d) => (
                  <li key={d} className="flex items-center gap-3">
                    <span className="size-2 bg-ink" />
                    {d}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-x-10 gap-y-2 border-t border-black/10 pt-5 font-ui text-[13px]">
                <span>
                  <span className="text-black/45">Realizacja</span> {service.time}
                </span>
                <span>
                  <span className="text-black/45">Szacunkowo</span> od {pln(total)}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* panel właściwości */}
      <aside className="ui-panel flex flex-col overflow-hidden text-[13px] text-[#2c2c2e]" aria-label="Właściwości komponentu">
        <div className="flex gap-4 border-b border-black/[0.07] px-4 py-3 text-[12px] font-medium">
          <span>Projekt</span>
          <span className="text-black/35">Prototyp</span>
          <span className="text-black/35">Inspekcja</span>
        </div>

        <div className="border-b border-black/[0.07] p-3">
          <p className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-medium text-comp">
            <Diamond /> Instancja · Wariant
          </p>
          <div className="space-y-0.5" role="radiogroup" aria-label="Rodzaj usługi">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={s.id === sid}
                onClick={() => pick(s.id)}
                className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition-colors ${
                  s.id === sid ? "bg-sel/10 text-ink" : "hover:bg-black/[0.03]"
                }`}
              >
                <span>{s.name}</span>
                <span className="font-mono text-[11px] text-black/40">od {pln(s.base)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 border-b border-black/[0.07] p-3">
          <p className="mb-2 px-1 text-[11px] font-medium text-black/45">Właściwości</p>
          <AnimatePresence mode="wait">
            <motion.div key={sid} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-0.5">
              {service.props.map((p) =>
                p.type === "select" ? (
                  <div key={p.key} className="flex items-center justify-between px-2 py-1.5">
                    <span>{p.label}</span>
                    <div className="flex rounded-md bg-black/[0.05] p-0.5">
                      {p.options.map((o, i) => (
                        <button
                          key={o.label}
                          type="button"
                          onClick={() => setValues((v) => ({ ...v, [p.key]: i }))}
                          className={`rounded-[5px] px-2.5 py-1 text-[12px] transition-colors ${values[p.key] === i ? "bg-white shadow-[0_1px_2px_rgb(0_0_0/0.12)]" : "text-black/50"}`}
                          aria-pressed={values[p.key] === i}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Toggle key={p.key} label={p.label} on={Boolean(values[p.key])} onChange={(on) => setValues((v) => ({ ...v, [p.key]: on }))} />
                ),
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-4">
          <div className="space-y-1 text-[12px] text-black/50">
            {lines.map((l) => (
              <div key={l.label} className="flex justify-between">
                <span>{l.label}</span>
                <span className="font-mono">+{pln(l.price)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-baseline justify-between border-t border-black/[0.07] pt-3">
            <span className="text-[12px] text-black/50">Szacunkowo od</span>
            <span className="font-display text-[30px] font-semibold tracking-[-0.03em] tabular-nums">{pln(total)}</span>
          </div>
          <button type="button" onClick={send} className="ui-btn-blue mt-4 h-10 w-full justify-center">
            Wyślij tę konfigurację
          </button>
          <p className="mt-2 text-center text-[11px] text-black/40">Dokładną cenę potwierdzam po krótkiej rozmowie.</p>
        </div>
      </aside>
    </div>
  );
}
