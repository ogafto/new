"use client";

import { useState } from "react";

type Props = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
  area?: boolean;
  minLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  className?: string;
  hint?: string;
  value?: string;
  onChange?: (v: string) => void;
  autoFocus?: boolean;
};

// Pole z pływającą etykietą w zaokrąglonej ramce
export default function Input({ name, label, type = "text", required, autoComplete, defaultValue, area, minLength, inputMode, className = "", hint, value, onChange, autoFocus }: Props) {
  const ctl = value !== undefined ? { value, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange?.(e.target.value) } : { defaultValue };
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  const cls =
    "peer w-full rounded-2xl border border-line-2 bg-white/[0.02] px-4 text-[16px] text-ink outline-none transition-[border-color,background-color,box-shadow] duration-300 placeholder:text-transparent hover:border-white/25 focus:border-accent focus:bg-accent/[0.04] focus:shadow-[0_0_0_4px_rgb(139_108_255/0.12)]";
  return (
    <div className={className}>
      <label className="relative block">
        {area ? (
          <textarea name={name} required={required} minLength={minLength} rows={4} placeholder={label} {...ctl} autoFocus={autoFocus} className={`${cls} resize-none pt-7 pb-3 leading-relaxed`} />
        ) : (
          <input
            name={name}
            type={isPass && show ? "text" : type}
            required={required}
            minLength={minLength}
            autoComplete={autoComplete}
            {...ctl}
            autoFocus={autoFocus}
            inputMode={inputMode}
            placeholder={label}
            className={`${cls} h-[60px] pt-5 ${isPass ? "pr-20" : ""}`}
          />
        )}
        <span
          className={`pointer-events-none absolute left-[17px] text-[15px] text-dim transition-all duration-300 ease-out-expo peer-focus:top-[10px] peer-focus:translate-y-0 peer-focus:text-[11.5px] peer-focus:text-accent-2 peer-[:not(:placeholder-shown)]:top-[10px] peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11.5px] ${
            area ? "top-[19px]" : "top-1/2 -translate-y-1/2"
          }`}
        >
          {label}
          {required && <span className="text-accent"> *</span>}
        </span>
        {isPass && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full px-3 py-1.5 text-[12px] text-muted transition-colors hover:bg-white/5 hover:text-ink"
            aria-label={show ? "Ukryj hasło" : "Pokaż hasło"}
          >
            {show ? "Ukryj" : "Pokaż"}
          </button>
        )}
      </label>
      {hint && <p className="mt-2 pl-1 text-[12.5px] text-dim">{hint}</p>}
    </div>
  );
}
