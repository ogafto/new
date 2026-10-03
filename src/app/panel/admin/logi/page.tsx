import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { KINDS, listLogs, logStats } from "@/lib/logs";
import LogList from "@/components/panel/LogList";

export const metadata: Metadata = { title: "Logi" };

export default async function LogsPage({ searchParams }: { searchParams: Promise<{ typ?: string; poziom?: string; q?: string; przed?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const limit = 80;
  const [rows, stats] = await Promise.all([listLogs({ kind: sp.typ, level: sp.poziom, q: sp.q, before: Number(sp.przed) || undefined, limit: limit + 1 }), logStats()]);
  return (
    <LogList
        rows={rows.slice(0, limit).map((r) => ({ ...r, ts: Number(r.ts) }))}
        more={rows.length > limit}
        kinds={KINDS}
        stats={stats}
        filters={{ typ: sp.typ ?? "", poziom: sp.poziom ?? "", q: sp.q ?? "", przed: sp.przed ?? "" }}
      />
  );
}
