import { all, run } from "./db";
import { id } from "./auth/crypto";

/* Biblioteka marki w panelu: pliki wgrane przez admina (animacje, grafiki) i własne kolory. */

export type BrandCategory = "animacje" | "grafiki";
export type BrandAsset = { id: string; category: BrandCategory; name: string; url: string; kind: string; bytes: number; note: string | null; created_at: number };
export type BrandColor = { id: string; name: string; hex: string; note: string | null; created_at: number };

export const KINDS = ["mp4", "webm", "gif", "png", "jpg", "jpeg", "webp", "svg", "pdf"] as const;
export const MIME: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  gif: "image/gif",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
};
export const MAX_BYTES = 200 * 1024 * 1024;
export const kindOf = (name: string) => name.toLowerCase().split(".").pop() ?? "";
export const categoryFor = (kind: string): BrandCategory => (["mp4", "webm", "gif"].includes(kind) ? "animacje" : "grafiki");

export async function listBrandAssets() {
  return (await all<BrandAsset>("SELECT * FROM brand_assets ORDER BY created_at DESC LIMIT 500")).map((a) => ({ ...a, bytes: Number(a.bytes), created_at: Number(a.created_at) }));
}
export async function listBrandColors() {
  return (await all<BrandColor>("SELECT * FROM brand_colors ORDER BY created_at")).map((c) => ({ ...c, created_at: Number(c.created_at) }));
}

export async function addBrandAsset(a: { category: BrandCategory; name: string; url: string; kind: string; bytes: number }) {
  const aid = id();
  await run("INSERT INTO brand_assets (id, category, name, url, kind, bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [aid, a.category, a.name.slice(0, 160), a.url, a.kind, a.bytes, Date.now()]);
  return aid;
}
