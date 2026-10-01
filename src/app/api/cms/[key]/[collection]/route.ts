import { publicContent } from "@/lib/cms";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers });
}

export async function GET(_: Request, { params }: { params: Promise<{ key: string; collection: string }> }) {
  const { key, collection } = await params;
  const data = await publicContent(key, collection);
  if (!data) return Response.json({ error: "Nie znaleziono" }, { status: 404, headers });
  return Response.json(data, { headers });
}
