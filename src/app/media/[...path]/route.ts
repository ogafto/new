import { open, stat } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/storage";
import { setting } from "@/lib/settings";

const TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
};

// Pliki wgrane w panelu (data/uploads) — tylko odczyt, bez wychodzenia poza katalog.
// Obsługa Range (Safari odtwarza MP4 tylko z zakresami bajtów).
// Prywatny magazyn Vercel Blob: /media/b/<ścieżka> — pobieramy z tokenem i przekazujemy dalej
async function fromBlob(req: Request, pathname: string) {
  const token = await setting("blob_token");
  if (!token) return new Response("Nie znaleziono", { status: 404 });
  const { get } = await import("@vercel/blob");
  const range = req.headers.get("range");
  const r = await get(pathname, { access: "private", token, headers: range ? { range } : undefined }).catch(() => null);
  if (!r || !r.stream) return new Response("Nie znaleziono", { status: 404 });
  const h = new Headers({
    "Content-Type": r.blob.contentType ?? TYPES[path.extname(pathname).toLowerCase()] ?? "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
  });
  for (const k of ["content-length", "content-range", "etag"]) {
    const v = r.headers.get(k);
    if (v) h.set(k, v);
  }
  if (pathname.toLowerCase().endsWith(".svg")) h.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox");
  return new Response(r.stream, { status: h.has("content-range") ? 206 : 200, headers: h });
}

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  if (parts[0] === "b" && parts.length > 1) return fromBlob(req, parts.slice(1).join("/"));
  const file = path.resolve(/*turbopackIgnore: true*/ UPLOAD_DIR, ...parts);
  if (!file.startsWith(UPLOAD_DIR + path.sep)) return new Response("Nie znaleziono", { status: 404 });
  try {
    const s = await stat(file);
    if (!s.isFile()) throw new Error();
    const ext = path.extname(file).toLowerCase();
    const headers: Record<string, string> = {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Accept-Ranges": "bytes",
      "X-Content-Type-Options": "nosniff",
    };
    if (ext === ".svg") headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox";
    const range = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
    const fh = await open(file);
    try {
      if (range) {
        const start = range[1] ? Number(range[1]) : Math.max(0, s.size - Number(range[2]));
        const end = range[1] && range[2] ? Math.min(Number(range[2]), s.size - 1) : s.size - 1;
        if (start > end || start >= s.size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${s.size}` } });
        const buf = Buffer.alloc(end - start + 1);
        await fh.read(buf, 0, buf.length, start);
        return new Response(buf, { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${s.size}`, "Content-Length": String(buf.length) } });
      }
      const buf = Buffer.alloc(s.size);
      await fh.read(buf, 0, s.size, 0);
      return new Response(buf, { headers: { ...headers, "Content-Length": String(s.size) } });
    } finally {
      await fh.close();
    }
  } catch {
    return new Response("Nie znaleziono", { status: 404 });
  }
}
