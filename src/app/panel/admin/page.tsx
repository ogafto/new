import type { Metadata } from "next";
import { all } from "@/lib/db";
import type { Invite, User } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { Card, PageHead } from "@/components/panel/ui";
import InviteForm from "@/components/panel/InviteForm";
import { ClientRow, InviteActions } from "@/components/panel/AdminRows";

export const metadata: Metadata = { title: "Administrator" };

function status(i: Invite, now: number) {
  if (i.used_at) return { label: "Konto założone", cls: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200", active: false };
  if (i.revoked_at) return { label: "Anulowane", cls: "border-line-2 text-dim", active: false };
  if (i.expires_at < now) return { label: "Wygasło", cls: "border-amber-300/25 bg-amber-300/10 text-amber-200", active: false };
  return { label: "Oczekuje", cls: "border-accent/30 bg-accent/10 text-accent-2", active: true };
}

async function load() {
  const [invites, clients] = await Promise.all([
    all<Invite>("SELECT * FROM invites ORDER BY created_at DESC LIMIT 100"),
    all<User>("SELECT * FROM users WHERE role = 'client' ORDER BY created_at DESC"),
  ]);
  const now = Date.now();
  return { clients, invites: invites.map((i) => ({ ...i, st: status(i, now) })) };
}

export default async function AdminPage() {
  const admin = await requireAdmin();
  const { invites, clients } = await load();
  const pending = invites.filter((i) => i.st.active).length;
  const stats = [
    { label: "Klienci", value: clients.filter((c) => c.verified_at).length },
    { label: "Aktywne zaproszenia", value: pending },
    { label: "W trakcie realizacji", value: clients.filter((c) => c.verified_at && c.stage < 4).length },
  ];

  return (
    <>
      <PageHead kicker="Administrator" title={`Cześć, ${admin.name.split(" ")[0]}.`} />

      <div className="grid gap-5 sm:grid-cols-3">
        {stats.map((s, i) => (
          <Card key={s.label} delay={i * 0.05} className="!p-6">
            <p className="text-[13px] text-dim">{s.label}</p>
            <p className="h-display mt-3 text-[44px]">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-5">
        <Card delay={0.15}>
          <InviteForm />
        </Card>
      </div>

      <div className="mt-5">
        <Card delay={0.2}>
          <h2 className="text-[18px] font-medium tracking-[-0.01em]">Klienci</h2>
          {clients.length === 0 ? (
            <p className="mt-4 text-[14px] text-dim">Nikt jeszcze nie założył konta. Wyślij pierwsze zaproszenie powyżej.</p>
          ) : (
            <ul className="mt-5 divide-y divide-line">
              {clients.map((c) => (
                <ClientRow
                  key={c.id}
                  c={{ id: c.id, name: c.name, email: c.email, verified: !!c.verified_at, stage: c.stage, project: c.project ?? "", since: fmtDate(c.created_at), last: c.last_login_at ? fmtDateTime(c.last_login_at) : "—" }}
                />
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-5">
        <Card delay={0.25}>
          <h2 className="text-[18px] font-medium tracking-[-0.01em]">Zaproszenia</h2>
          {invites.length === 0 ? (
            <p className="mt-4 text-[14px] text-dim">Brak wysłanych zaproszeń.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
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
                  {invites.map((i) => {
                    const st = i.st;
                    const open = !i.used_at;
                    return (
                      <tr key={i.id} className="align-middle">
                        <td className="py-3.5 pr-4">
                          <span className="block">{i.email}</span>
                          {i.name && <span className="text-[12px] text-dim">{i.name}</span>}
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[12px] ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="py-3.5 pr-4 text-muted">
                          {fmtDateTime(i.created_at)}
                          {i.sent_count > 1 && <span className="text-dim"> · ×{i.sent_count}</span>}
                        </td>
                        <td className="py-3.5 pr-4 text-muted">{fmtDate(i.expires_at)}</td>
                        <td className="py-3.5 text-right">{open && <InviteActions id={i.id} canRevoke={st.active} />}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
