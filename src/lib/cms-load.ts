import { headers } from "next/headers";
import { getCollections, getEntries } from "./cms";

export async function loadCollections(siteId: string) {
  const cols = await getCollections(siteId);
  return Promise.all(cols.map(async (c) => ({ ...c, entries: (await getEntries(c.id)).map((e) => ({ ...e, sort: Number(e.sort), updated_at: Number(e.updated_at) })) })));
}

export async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "afto.works";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
