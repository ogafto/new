import type { Metadata } from "next";
import { all } from "@/lib/db";
import type { Invite, User } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { Badge, Card, CardHead, Empty, PageHead } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import InviteForm from "@/components/panel/InviteForm";
import { ClientRow, InviteActions } from "@/components/panel/AdminRows";

export const metadata: Metadata = { title: "Klienci" };

function status(i: Invite, now: number) {
  if (i.used_at) return { label: "Konto założone", tone: "green" as const, active: false };
  if (i.revoked_at) return { label: "Anulowane", tone: "default" as const, active: false };
  if (i.expires_at < now) return { label: "Wygasło", tone: "amber" as const, active: false };
  return { label: "Oczekuje", tone: "accent" as const, active: true };
}

async function load() {
  const [invites, clients, sites] = await Promise.all([
    all<Invite>("SELECT * FROM invites ORDER BY created_at DESC LIMIT 100"),
    all<User>("SELECT * FROM users WHERE role = 'client' ORDER BY created_at DESC"),
    all<{ id: string; name: string; owner_id: string }>("SELECT id, name, owner_id FROM cms_sites WHERE owner_id IS NOT NULL"),
  ]);
  const now = Date.now();
  return { clients, sites, invites: invites.map((i) => ({ ...i, st: status(i, now) })) };
}

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ email?: string; imie?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const { invites, clients, sites } = await load();
  return (
    <>
      <PageHead kicker="Klienci" title="Klienci i zaproszenia" />

      <Card glow>
        <InviteForm email={sp.email} name={sp.imie} />
      </Card>

      <div className="mt-4">
        <Card delay={0.08}>
          <CardHead title="Klienci" sub="Nazwa projektu i etap są widoczne w panelu klienta" />
          {clients.length === 0 ? (
            <Empty icon={ICONS.users} title="Nikt jeszcze nie założył konta" text="Wyślij zaproszenie powyżej — klient założy konto kodem z maila." />
          ) : (
            <ul className="divide-y divide-line">
              {clients.map((c) => {
                const site = sites.find((s) => s.owner_id === c.id);
                return (
                  <ClientRow
                    key={c.id}
                    c={{
                      id: c.id,
                      name: c.name,
                      email: c.email,
                      phone: c.phone,
                      verified: !!c.verified_at,
                      stage: Number(c.stage),
                      project: c.project ?? "",
                      since: fmtDate(Number(c.created_at)),
                      last: c.last_login_at ? fmtDateTime(Number(c.last_login_at)) : "—",
                      site: site ? { id: site.id, name: site.name } : null,
                    }}
                  />
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4">
        <Card delay={0.12}>
          <CardHead title="Zaproszenia" />
          {invites.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-dim">Brak wysłanych zaproszeń.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[14px]">
                <thead className="text-[12px] text-dim">
                  <tr className="border-b border-line">
                    <th className="pb-3 font-normal">Adres</th>
                    <th className="pb-3 font-normal">Status</th>
                    <th className="pb-3 font-normal">Wysłano</th>
                    <th className="pb-3 font-normal">Ważne do</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {invites.map((i) => (
                    <tr key={i.id} className="align-middle">
                      <td className="py-3.5 pr-4">
                        <span className="block">{i.email}</span>
                        {i.name && <span className="text-[12px] text-dim">{i.name}</span>}
                      </td>
                      <td className="py-3.5 pr-4">
                        <Badge tone={i.st.tone}>{i.st.label}</Badge>
                      </td>
                      <td className="py-3.5 pr-4 text-muted">
                        {fmtDateTime(Number(i.created_at))}
                        {Number(i.sent_count) > 1 && <span className="text-dim"> · ×{i.sent_count}</span>}
                      </td>
                      <td className="py-3.5 pr-4 text-muted">{fmtDate(Number(i.expires_at))}</td>
                      <td className="py-3.5 text-right">{!i.used_at && <InviteActions id={i.id} canRevoke={i.st.active} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
