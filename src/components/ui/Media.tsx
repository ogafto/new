"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { isGif, isVideo } from "@/lib/media";

/*
 * Praca w portfolio: zdjęcie, GIF albo wideo.
 * Wideo gra samo, wyciszone, w pętli — ale tylko na ekranie (plik ładuje się dopiero, gdy jest blisko).
 * GIF-y idą bez optymalizacji Next (żeby nie gubić animacji).
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
};

function Video({ src, alt, w, h, fill, className = "", style, eager }: Props & { eager?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(!!eager);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          el.play().catch(() => {});
        } else el.pause();
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      src={near ? src : undefined}
      muted
      loop
      playsInline
      autoPlay
      preload={near ? "auto" : "none"}
      width={w ?? undefined}
      height={h ?? undefined}
      aria-label={alt || undefined}
      className={`${fill ? "absolute inset-0 size-full" : ""} ${className}`}
      style={!fill && w && h ? { aspectRatio: `${w} / ${h}`, ...style } : style}
    />
  );
}

export default function Media({ src, alt = "", w, h, fill, sizes, className = "", quality, loading, style }: Props) {
  if (isVideo(src)) return <Video src={src} alt={alt} w={w} h={h} fill={fill} className={className} style={style} eager={loading === "eager"} />;
  const common = { src, sizes, quality, loading, className, style, unoptimized: isGif(src) };
  return fill ? <Image fill alt={alt} {...common} /> : <Image width={w ?? 1920} height={h ?? 1080} alt={alt} {...common} />;
}
