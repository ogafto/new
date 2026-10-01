import { publicContent } from "@/lib/cms";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers });
}

// Publiczne treści strony klienta (tylko odczyt)
export async function GET(_: Request, { params }: { params: Promise<{ key: string }> }) {
  const data = await publicContent((await params).key);
  if (!data) return Response.json({ error: "Nie znaleziono" }, { status: 404, headers });
  return Response.json(data, { headers });
}
