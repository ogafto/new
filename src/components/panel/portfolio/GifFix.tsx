"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { swapMedia } from "@/app/panel/admin/portfolio/actions";
import { gifToMp4 } from "@/lib/gif-video";
import { attachMedia, type BlobMode, type Stage } from "@/lib/upload";
import { plural } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { Btn, ease, ICONS, Icon } from "../kit";

/*
 * GIF-y, które już są w portfolio: jednym kliknięciem zamienia je na wideo MP4.
 * Robi to przeglądarka (pobiera GIF, koduje wideo, wgrywa i podmienia plik w pracy) — nazwa, opis i kolejność zostają.
 */

type Gif = { id: string; name: string; image: string };
type Run = { i: number; n: number; name: string; p: number; stage: Stage };
type Done = { n: number; before: number; after: number; failed: string[] };

const mb = (b: number) => `${(b / 1e6).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} MB`;
const gifs_ = (n: number) => `${n} ${plural(n, "GIF", "GIF-y", "GIF-ów")}`;

export default function GifFix({ gifs, blob }: { gifs: Gif[]; blob: BlobMode }) {
  const router = useRouter();
  const [run, setRun] = useState<Run | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  // w trakcie: ostrzeż przed zamknięciem karty
  useEffect(() => {
    if (!run) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [run]);

  if (!gifs.length && !done && !run) return null;

  const go = async () => {
    const list = [...gifs];
    const res: Done = { n: 0, before: 0, after: 0, failed: [] };
    setDone(null);
    for (const [i, g] of list.entries()) {
      setRun({ i, n: list.length, name: g.name, p: 0, stage: "convert" });
      try {
        const r = await fetch(g.image);
        if (!r.ok) throw new Error();
        const gif = new File([await r.blob()], `${slugify(g.name) || "praca"}.gif`, { type: "image/gif" });
        const mp4 = await gifToMp4(gif, (p) => setRun((x) => x && { ...x, p, stage: "convert" }));
        if (!mp4) throw new Error();
        const fd = new FormData();
        await attachMedia(fd, "image", mp4, blob, (p, stage) => setRun((x) => x && { ...x, p, stage }));
        const s = await swapMedia(g.id, fd);
        if (s.error) throw new Error(s.error);
        res.n++;
        res.before += gif.size;
        res.after += mp4.size;
      } catch {
        res.failed.push(g.name);
      }
    }
    setRun(null);
    setDone(res);
    router.refresh();
  };

  const names = gifs.map((g) => g.name).join(", ");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease }}
      className={`relative overflow-hidden rounded-[22px] border p-4 sm:p-5 ${done && !gifs.length ? "border-emerald-400/25 bg-emerald-400/[0.06]" : "border-amber-300/20 bg-[radial-gradient(80%_160%_at_0%_0%,rgb(251_191_36/0.09),transparent)]"}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className={`grid size-11 shrink-0 place-items-center rounded-2xl border ${done && !gifs.length ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-amber-300/20 bg-amber-300/10 text-amber-200"}`}>
          <Icon d={done && !gifs.length ? ICONS.check : ICONS.bolt} />
        </span>
        <div className="min-w-0 flex-1">
          {run ? (
            <>
              <p className="text-[15px]">
                Zamieniam {run.i + 1} z {run.n}: „{run.name}”
              </p>
              <p className="mt-0.5 text-[12.5px] text-dim">{run.stage === "convert" ? "Koduję wideo" : "Wgrywam"} · nie zamykaj tej karty</p>
            </>
          ) : done && !gifs.length ? (
            <>
              <p className="text-[15px]">Gotowe: {gifs_(done.n)} to teraz wideo</p>
              <p className="mt-0.5 text-[12.5px] text-dim">
                Waga: {mb(done.before)} → {mb(done.after)}. Na stronie wyglądają tak samo, a ładują się i przewijają płynnie.
              </p>
            </>
          ) : (
            <>
              <p className="text-[15px]">
                {gifs_(gifs.length)} {plural(gifs.length, "spowalnia", "spowalniają", "spowalnia")} stronę
              </p>
              <p className="mt-0.5 text-[12.5px] text-dim">
                Zamienię je na wideo MP4: wyglądają tak samo, ważą kilka razy mniej i nie zacinają przewijania. Nowe GIF-y zamieniam same przy wgrywaniu.
                <span className="mt-1 block truncate text-muted">{names}</span>
              </p>
              {done && done.failed.length > 0 && (
                <p className="mt-1.5 text-[12.5px] text-red-300">Nie wyszło: {done.failed.join(", ")}. Spróbuj jeszcze raz albo w Chrome / Safari.</p>
              )}
            </>
          )}
        </div>
        {!run && gifs.length > 0 && (
          <Btn type="button" variant="primary" icon={ICONS.bolt} onClick={go} className="self-start sm:self-auto">
            Zamień na wideo
          </Btn>
        )}
      </div>
      <AnimatePresence>
        {run && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.07]">
            <motion.div className="h-full rounded-full bg-amber-200" animate={{ width: `${((run.i + (run.stage === "convert" ? run.p * 0.7 : 70 + run.p * 0.3) / 100) / run.n) * 100}%` }} transition={{ duration: 0.3 }} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
