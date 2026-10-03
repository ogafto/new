import type { Metadata } from "next";
import { all } from "@/lib/db";
import type { Invite, User } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { STAGES } from "@/lib/format";
import { Card, Count, Icon, PageHead } from "@/components/panel/kit";
import { ICONS } from "@/components/panel/icons";
import InviteButton from "@/components/panel/InviteForm";
import { ClientsTable, InvitesTable, type InviteStatus } from "@/components/panel/AdminRows";

export const metadata: Metadata = { title: "Klienci" };

function status(i: Invite, now: number): InviteStatus {
  if (i.used_at) return "used";
  if (i.revoked_at) return "revoked";
  if (Number(i.expires_at) < now) return "expired";
  return "active";
}

async function load() {
  const [invites, clients, sites] = await Promise.all([
    all<Invite>("SELECT * FROM invites ORDER BY created_at DESC LIMIT 100"),
    all<User>("SELECT * FROM users WHERE role = 'client' ORDER BY created_at DESC"),
    all<{ id: string; name: string; owner_id: string }>("SELECT id, name, owner_id FROM cms_sites WHERE owner_id IS NOT NULL"),
  ]);
  return { invites, clients, sites, now: Date.now() };
}

export default async function ClientsPage() {
  await requireAdmin();
  const { invites, clients, sites, now } = await load();
  const last = STAGES.length - 1;
  const inv = invites.map((i) => ({ id: i.id, email: i.email, name: i.name, created: Number(i.created_at), expires: Number(i.expires_at), sent: Number(i.sent_count), status: status(i, now) }));
  const stats = [
    { label: "Klienci", value: clients.length, icon: ICONS.users },
    { label: "W trakcie", value: clients.filter((c) => Number(c.stage) < last).length, icon: ICONS.clock },
    { label: "Opublikowane", value: clients.filter((c) => Number(c.stage) >= last).length, icon: ICONS.globe },
    { label: "Aktywne zaproszenia", value: inv.filter((i) => i.status === "active").length, icon: ICONS.mail },
  ];

  return (
    <>
      <PageHead title="Klienci">
        <InviteButton />
      </PageHead>

      <Card pad={false} className="mb-4">
        <dl className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className={`flex items-center justify-between gap-3 p-4 sm:p-5 ${i % 2 ? "border-l border-line" : ""} ${i > 1 ? "border-t border-line lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}>
              <div className="min-w-0">
                <dt className="truncate text-[12.5px] text-dim">{s.label}</dt>
                <dd className="mt-1.5">
                  <Count value={s.value} className="h-display text-[28px] leading-none sm:text-[32px]" />
                </dd>
              </div>
              <span className="hidden size-9 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-dim sm:grid">
                <Icon d={s.icon} className="size-4" />
              </span>
            </div>
          ))}
        </dl>
      </Card>

      <div className="space-y-4">
        <ClientsTable
          now={now}
          rows={clients.map((c) => {
            const site = sites.find((s) => s.owner_id === c.id);
            return {
              id: c.id,
              name: c.name,
              email: c.email,
              phone: c.phone,
              verified: !!c.verified_at,
              stage: Number(c.stage),
              project: c.project ?? "",
              created: Number(c.created_at),
              last: c.last_login_at ? Number(c.last_login_at) : null,
              site: site ? { id: site.id, name: site.name } : null,
            };
          })}
        />
        <InvitesTable rows={inv} />
      </div>
    </>
  );
}
