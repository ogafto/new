import { publicContent } from "@/lib/cms";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

// Jedna sekcja — tak samo: publicznie albo ?private=1 + Bearer sk_… (z polami „sekret”)
export async function GET(req: Request, { params }: { params: Promise<{ key: string; collection: string }> }) {
  const { key, collection } = await params;
  const priv = new URL(req.url).searchParams.get("private") === "1";
  const auth = priv ? (req.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1] ?? null) : null;
  const data = await publicContent(key, collection, { secret: auth, from: req.headers.get("origin") ?? req.headers.get("user-agent") });
  if (!data) return Response.json({ error: "Nie znaleziono" }, { status: 404, headers: cors });
  if (priv && !data.private) return Response.json({ error: "Nieprawidłowy klucz sekretny" }, { status: 401, headers: { ...cors, "Cache-Control": "no-store" } });
  return Response.json(data, { headers: { ...cors, "Cache-Control": priv ? "private, no-store" : "no-store" } });
}
