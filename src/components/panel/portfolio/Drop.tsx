"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { shrinkInput } from "@/lib/shrink";
import { isVideo } from "@/lib/media";
import { ICONS, Icon } from "../kit";

// Pole na plik: kliknij albo upuść; podgląd od razu. Zdjęcia są zmniejszane w przeglądarce przed wysłaniem.
// `accept` decyduje, co wolno wrzucić (domyślnie same zdjęcia; dla pracy także GIF i wideo).
export default function Drop({
  name,
  current,
  onPreview,
  onPick,
  multiple = false,
  onFiles,
  accept = "image/*",
  aspect = "aspect-[4/3]",
  hint = "JPG, PNG, WebP · do 1920 × 1080",
}: {
  name: string;
  current?: string;
  onPreview?: (url: string, video: boolean) => void;
  onPick?: (file: File) => void;
  multiple?: boolean;
  onFiles?: (urls: string[]) => void;
  accept?: string;
  aspect?: string;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [preview, setPreview] = useState({ url: current ?? "", video: isVideo(current) });
  const ok = (f: File) => (accept === "image/*" ? f.type.startsWith("image/") : accept.split(",").includes(f.type));
  const use = (files: FileList | null) => {
    if (!files?.length) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    if (multiple) onFiles?.(urls);
    else {
      const video = files[0].type.startsWith("video/");
      setPreview({ url: urls[0], video });
      onPreview?.(urls[0], video);
      onPick?.(files[0]);
    }
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), input.current?.click())}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!input.current) return;
        const dt = new DataTransfer();
        if (multiple) for (const f of Array.from(input.current.files ?? [])) dt.items.add(f);
        const fresh = Array.from(e.dataTransfer.files).filter(ok);
        for (const f of multiple ? fresh : fresh.slice(0, 1)) dt.items.add(f);
        input.current.files = dt.files;
        shrinkInput(input.current);
        const show = new DataTransfer();
        for (const f of multiple ? fresh : fresh.slice(0, 1)) show.items.add(f);
        use(show.files);
      }}
      onClick={() => input.current?.click()}
      className={`group relative grid cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed outline-none transition-[border-color,background-color,box-shadow] duration-300 focus-visible:shadow-[0_0_0_4px_rgb(139_108_255/0.15)] ${over ? "border-accent bg-accent/[0.08] shadow-[0_0_0_4px_rgb(139_108_255/0.12)]" : "border-white/[0.12] bg-[radial-gradient(80%_100%_at_50%_0%,rgb(139_108_255/0.06),transparent)] hover:border-white/25"} ${multiple ? "h-24" : aspect}`}
    >
      <input
        ref={input}
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          use(e.target.files);
          shrinkInput(e.target);
        }}
      />
      {!multiple && preview.url ? (
        <>
          {preview.video ? (
            <video src={preview.url} muted loop autoPlay playsInline className="absolute inset-0 size-full object-contain p-3" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.url} alt="" className="absolute inset-0 size-full object-contain p-3 transition-transform duration-700 ease-out-expo group-hover:scale-[1.02]" />
          )}
          <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[12.5px] text-white backdrop-blur-md transition-colors group-hover:bg-white group-hover:text-bg">
            <Icon d={ICONS.upload} className="size-3.5" /> Zmień
          </span>
        </>
      ) : (
        <span className={`flex items-center gap-3 text-[13px] text-muted ${multiple ? "flex-row" : "flex-col text-center"}`}>
          <motion.span animate={over ? { y: -4, scale: 1.06 } : { y: 0, scale: 1 }} className="grid size-11 place-items-center rounded-xl border border-accent/20 bg-accent/10 text-accent-2">
            <Icon d={multiple ? ICONS.plus : ICONS.upload} />
          </motion.span>
          <span className={multiple ? "text-left" : ""}>
            <span className="block text-ink">{over ? "Upuść tutaj" : multiple ? "Dodaj zdjęcia" : accept === "image/*" ? "Upuść zdjęcie albo kliknij" : "Upuść plik albo kliknij"}</span>
            <span className="block text-[11.5px] text-dim">{hint}</span>
          </span>
        </span>
      )}
    </div>
  );
}
