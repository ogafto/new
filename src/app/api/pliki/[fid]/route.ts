import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import path from "node:path";
import { one } from "@/lib/db";
import { currentUser } from "@/lib/auth/session";
import { canSee, type OrderFile } from "@/lib/deliver";
import { setting } from "@/lib/settings";
import { UPLOAD_DIR } from "@/lib/storage";

export const dynamic = "force-dynamic";

/*
 * Pobieranie pliku zlecenia: tylko zalogowany klient tego zlecenia albo admin.
 * Plik z Vercel Blob (publiczny lub prywatny) albo z dysku serwera — zawsze jako załącznik z oryginalną nazwą.
 */
export async function GET(_: Request, { params }: { params: Promise<{ fid: string }> }) {
  const { fid } = await params;
  const user = await currentUser();
  if (!user || !user.verified_at) return new Response("Zaloguj się", { status: 401 });
  const f = await one<OrderFile & { user_id: string | null; client_email: string | null }>(
    "SELECT f.*, o.user_id, o.client_email FROM order_files f JOIN orders o ON o.id = f.order_id WHERE f.id = ?",
    [fid],
  );
  if (!f || !canSee(user, f)) return new Response("Nie znaleziono", { status: 404 });
  const headers = new Headers({
    "Content-Type": f.mime || "application/octet-stream",
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(f.name)}`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });

  if (f.url.startsWith("https://")) {
    const token = await setting("blob_token");
    if (f.url.includes(".private.blob.") && token && f.pathname) {
      const { get } = await import("@vercel/blob");
      const r = await get(f.pathname, { access: "private", token }).catch(() => null);
      if (!r?.stream) return new Response("Nie znaleziono", { status: 404 });
      const len = r.headers.get("content-length");
      if (len) headers.set("Content-Length", len);
      return new Response(r.stream, { headers });
    }
    const r = await fetch(f.url).catch(() => null);
    if (!r?.ok || !r.body) return new Response("Nie znaleziono", { status: 404 });
    const len = r.headers.get("content-length");
    if (len) headers.set("Content-Length", len);
    return new Response(r.body, { headers });
  }

  const file = path.resolve(/*turbopackIgnore: true*/ UPLOAD_DIR, f.url.replace(/^\/media\//, ""));
  if (!file.startsWith(UPLOAD_DIR + path.sep)) return new Response("Nie znaleziono", { status: 404 });
  try {
    const s = await stat(file);
    headers.set("Content-Length", String(s.size));
    return new Response(Readable.toWeb(createReadStream(file)) as unknown as ReadableStream, { headers });
  } catch {
    return new Response("Nie znaleziono", { status: 404 });
  }
}
