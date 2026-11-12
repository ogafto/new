import { isRawType } from "./media";
import { shrinkImage } from "./shrink";

/*
 * Wgrywanie plików portfolio z przeglądarki.
 * Zdjęcia: zmniejszane tutaj do 1920 × 1080 i wysyłane w formularzu.
 * GIF / wideo: przeglądarka odczytuje wymiary; gdy strona używa Vercel Blob, plik idzie prosto do Blob
 * (duże pliki), a do formularza trafia tylko jego adres. Bez Blob (lokalnie) plik jedzie w formularzu.
 */

export type BlobMode = "public" | "private" | null;

// wymiary GIF-a lub wideo (dla układu strony, zanim plik się wczyta)
export async function probe(f: File): Promise<{ w: number; h: number } | null> {
  const url = URL.createObjectURL(f);
  try {
    if (f.type.startsWith("video/")) {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.src = url;
      await new Promise<void>((ok, fail) => {
        v.onloadedmetadata = () => ok();
        v.onerror = () => fail(new Error("video"));
        setTimeout(() => fail(new Error("timeout")), 10000);
      });
      return v.videoWidth && v.videoHeight ? { w: v.videoWidth, h: v.videoHeight } : null;
    }
    const b = await createImageBitmap(f);
    return { w: b.width, h: b.height };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const safeName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-80) || "plik";

/** Dokłada plik do formularza pod `key` (albo, dla GIF / wideo na Vercel Blob, wgrywa go i dokłada adres w polu „media”) */
export async function attachMedia(fd: FormData, key: string, f: File, blob: BlobMode, onProgress?: (p: number) => void) {
  if (!isRawType(f.type)) {
    fd.set(key, await shrinkImage(f));
    return;
  }
  const d = await probe(f);
  if (d) {
    fd.set("w", String(d.w));
    fd.set("h", String(d.h));
  }
  if (!blob) {
    fd.set(key, f);
    return;
  }
  const { upload } = await import("@vercel/blob/client");
  const r = await upload(`portfolio/${safeName(f.name)}`, f, {
    access: blob,
    handleUploadUrl: "/api/portfolio/upload",
    multipart: f.size > 8_000_000,
    onUploadProgress: (e) => onProgress?.(e.percentage),
  });
  fd.delete(key);
  fd.set("media", JSON.stringify({ url: r.url, pathname: r.pathname }));
}
