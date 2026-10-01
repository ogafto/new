"use server";

import { createElement } from "react";
import { revalidatePath } from "next/cache";
import InviteEmail from "@/emails/InviteEmail";
import { one, run, type Invite } from "@/lib/db";
import { id, inviteCode, normalizeCode, sha256 } from "@/lib/auth/crypto";
import { requireAdmin } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import { live } from "@/lib/analytics";
import { baseUrl, sendMail } from "@/lib/mail";

const INVITE_DAYS = 7;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type InviteState = { error?: string; ok?: boolean; code?: string; email?: string; mailed?: boolean; dev?: boolean } | undefined;

async function mailInvite(email: string, name: string | null, code: string) {
  return sendMail({
    to: email,
    subject: name ? `${name}, Twój panel w afto.works jest gotowy` : "Zaproszenie do panelu afto.works",
    react: createElement(InviteEmail, { email, name, code, baseUrl: baseUrl(), days: INVITE_DAYS }),
  });
}

export async function createInvite(_: InviteState, form: FormData): Promise<InviteState> {
  await requireAdmin();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const name = String(form.get("name") ?? "").trim().slice(0, 80) || null;
  if (!EMAIL.test(email)) return { error: "Podaj poprawny adres e-mail." };
  if (isAdminEmail(email)) return { error: "To adres administratora." };
  if (await one("SELECT 1 FROM users WHERE email = ? AND verified_at IS NOT NULL", [email])) return { error: "Ten adres ma już konto." };

  const now = Date.now();
  // poprzednie, niewykorzystane kody dla tego adresu przestają działać
  await run("UPDATE invites SET revoked_at = ? WHERE email = ? AND used_at IS NULL AND revoked_at IS NULL", [now, email]);
  const code = inviteCode();
  await run("INSERT INTO invites (id, email, name, code_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)", [
    id(),
    email,
    name,
    sha256(normalizeCode(code)),
    now,
    now + INVITE_DAYS * 86_400_000,
  ]);
  const sent = await mailInvite(email, name, code);
  revalidatePath("/panel/admin/klienci");
  return { ok: true, code, email, mailed: sent.ok, dev: sent.dev };
}

export async function resendInvite(inviteId: string): Promise<InviteState> {
  await requireAdmin();
  const inv = await one<Invite>("SELECT * FROM invites WHERE id = ?", [inviteId]);
  if (!inv || inv.used_at) return { error: "Zaproszenie nie istnieje albo zostało wykorzystane." };
  const code = inviteCode();
  const now = Date.now();
  await run("UPDATE invites SET code_hash = ?, expires_at = ?, sent_count = sent_count + 1, revoked_at = NULL WHERE id = ?", [
    sha256(normalizeCode(code)),
    now + INVITE_DAYS * 86_400_000,
    inviteId,
  ]);
  const sent = await mailInvite(inv.email, inv.name, code);
  revalidatePath("/panel/admin/klienci");
  return { ok: true, code, email: inv.email, mailed: sent.ok, dev: sent.dev };
}

export async function revokeInvite(inviteId: string) {
  await requireAdmin();
  await run("UPDATE invites SET revoked_at = ? WHERE id = ? AND used_at IS NULL", [Date.now(), inviteId]);
  revalidatePath("/panel/admin/klienci");
}

export async function updateClient(userId: string, form: FormData) {
  await requireAdmin();
  const stage = Math.max(0, Math.min(4, Number(form.get("stage")) || 0));
  const project = String(form.get("project") ?? "").trim().slice(0, 80) || null;
  await run("UPDATE users SET stage = ?, project = ? WHERE id = ? AND role = 'client'", [stage, project, userId]);
  revalidatePath("/panel/admin", "layout");
  revalidatePath("/panel");
}

export async function deleteClient(userId: string) {
  await requireAdmin();
  await run("DELETE FROM users WHERE id = ? AND role = 'client'", [userId]);
  await run("UPDATE cms_sites SET owner_id = NULL WHERE owner_id = ?", [userId]);
  revalidatePath("/panel/admin", "layout");
}

// licznik „teraz na stronie” w górnym pasku
export async function liveCount() {
  await requireAdmin();
  return live();
}
