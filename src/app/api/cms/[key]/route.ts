import { publicContent } from "@/lib/cms";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

const from = (req: Request) => req.headers.get("origin") ?? req.headers.get("referer") ?? req.headers.get("user-agent");

/*
 * Treści strony klienta.
 *   GET /api/cms/{key}             — publiczne (bez pól „sekret”), cache CDN 30 s
 *   GET /api/cms/{key}?private=1   — z nagłówkiem Authorization: Bearer sk_… — pełne, z sekretami, bez cache
 * Osobny adres dla wersji prywatnej, żeby CDN nigdy nie pomylił jej z publiczną.
 */
export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const priv = new URL(req.url).searchParams.get("private") === "1";
  const auth = priv ? (req.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1] ?? null) : null;
  const data = await publicContent((await params).key, undefined, { secret: auth, from: from(req) });
  if (!data) return Response.json({ error: "Nie znaleziono" }, { status: 404, headers: cors });
  if (priv && !data.private) return Response.json({ error: "Nieprawidłowy klucz sekretny" }, { status: 401, headers: { ...cors, "Cache-Control": "no-store" } });
  return Response.json(data, { headers: { ...cors, "Cache-Control": priv ? "private, no-store" : "public, s-maxage=30, stale-while-revalidate=300" } });
}
