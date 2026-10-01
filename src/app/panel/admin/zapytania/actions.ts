"use server";

import { revalidatePath } from "next/cache";
import { run } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";

export async function setInquiryStatus(iid: string, status: "new" | "contacted" | "won" | "lost") {
  await requireAdmin();
  await run("UPDATE inquiries SET status = ? WHERE id = ?", [status, iid]);
  revalidatePath("/panel/admin", "layout");
}

export async function setInquiryNote(iid: string, note: string) {
  await requireAdmin();
  await run("UPDATE inquiries SET note = ? WHERE id = ?", [note.slice(0, 2000) || null, iid]);
  revalidatePath("/panel/admin/zapytania");
}

export async function deleteInquiry(iid: string) {
  await requireAdmin();
  await run("DELETE FROM inquiries WHERE id = ?", [iid]);
  revalidatePath("/panel/admin", "layout");
}
