"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { isGif, isVideo } from "@/lib/media";

/*
 * Praca w portfolio: zdjęcie, GIF albo wideo.
 * Wideo gra samo, wyciszone, w pętli — ale tylko na ekranie (plik ładuje się dopiero, gdy jest blisko).
 * GIF-y idą bez optymalizacji Next (żeby nie gubić animacji). Nowe GIF-y panel i tak zamienia na wideo.
 */

type Props = {
  src: string;
  alt?: string;
  w?: number | null;
  h?: number | null;
  fill?: boolean;
  sizes?: string;
  className?: string;
  quality?: number;
  loading?: "eager" | "lazy";
  style?: React.CSSProperties;
  /** false = wideo stoi (np. warstwa pokazu przykryta inną); domyślnie gra, gdy jest na ekranie */
  active?: boolean;
};

function Video({ src, alt, w, h, fill, className = "", style, eager, active = true }: Props & { eager?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setSeen(e.isIntersecting);
        // „eager”: ładuj od razu, ale nie wideo ukryte (np. wersja na telefon przy ekranie poziomym)
        if (e.isIntersecting || (eager && el.getClientRects().length)) setNear(true);
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eager]);
  // gra tylko na ekranie (i gdy rodzic nie zatrzymał); poza nim nie zajmuje dekodera
  useEffect(() => {
    const el = ref.current;
    if (!el || !near) return;
    if (seen && active) el.play().catch(() => {});
    else el.pause();
  }, [seen, active, near]);
  return (
    <video
      ref={ref}
      src={near ? src : undefined}
      muted
      loop
      playsInline
      autoPlay={active}
      preload={near ? "auto" : "none"}
      width={w ?? undefined}
      height={h ?? undefined}
      aria-label={alt || undefined}
      className={`${fill ? "absolute inset-0 size-full" : ""} ${className}`}
      style={!fill && w && h ? { aspectRatio: `${w} / ${h}`, ...style } : style}
    />
  );
}

export default function Media({ src, alt = "", w, h, fill, sizes, className = "", quality, loading, style, active }: Props) {
  if (isVideo(src)) return <Video src={src} alt={alt} w={w} h={h} fill={fill} className={className} style={style} eager={loading === "eager"} active={active} />;
  const common = { src, sizes, quality, loading, className, style, unoptimized: isGif(src) };
  return fill ? <Image fill alt={alt} {...common} /> : <Image width={w ?? 1920} height={h ?? 1080} alt={alt} {...common} />;
}
