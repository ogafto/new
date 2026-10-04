"use server";

import { revalidatePath } from "next/cache";
import { one, run } from "@/lib/db";
import { id } from "@/lib/auth/crypto";
import { requireAdmin } from "@/lib/auth/session";
import { sendReminders } from "@/lib/orders";

export type OrderState = { error?: string; ok?: boolean } | undefined;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function saveOrder(_: OrderState, form: FormData): Promise<OrderState> {
  await requireAdmin();
  const oid = String(form.get("id") || "");
  const v = (k: string, max = 200) => String(form.get(k) ?? "").trim().slice(0, max);
  const title = v("title", 120);
  const client = v("client_name", 120);
  const start = v("start_date");
  const due = v("due_date");
  const status = v("status") || "planned";
  const amount = v("amount") ? Math.round(Number(v("amount").replace(",", "."))) : null;
  const remind = Math.max(0, Math.min(30, Number(v("remind_days") || 3)));
  if (title.length < 2) return { error: "Podaj nazwę zlecenia." };
  if (!client) return { error: "Podaj klienta." };
  if (!DATE.test(start) || !DATE.test(due)) return { error: "Podaj daty rozpoczęcia i terminu." };
  if (due < start) return { error: "Termin nie może być przed datą rozpoczęcia." };
  if (!["planned", "active", "done", "cancelled"].includes(status)) return { error: "Nieprawidłowy status." };
  if (amount !== null && !Number.isFinite(amount)) return { error: "Kwota musi być liczbą." };

  const email = v("client_email") || null;
  // konto klienta: zostaje przy edycji, a nowe zlecenie łączy się z kontem po e-mailu (panel klienta, pliki, strona w CMS)
  const account = email ? ((await one<{ id: string }>("SELECT id FROM users WHERE lower(email) = lower(?)", [email]))?.id ?? null) : null;
  const vals = [title, client, email, v("service") || null, amount, start, due, status, v("notes", 3000) || null, remind];
  if (oid) {
    const prev = await one<{ due_date: string; remind_days: number; status: string; user_id: string | null }>("SELECT due_date, remind_days, status, user_id FROM orders WHERE id = ?", [oid]);
    // zmiana terminu → przypomnienia wyślą się ponownie
    const reset = prev && (prev.due_date !== due || prev.remind_days !== remind);
    const doneAt = prev && prev.status !== status ? (status === "done" ? Date.now() : null) : undefined;
    await run(
      `UPDATE orders SET title=?, client_name=?, client_email=?, service=?, amount=?, start_date=?, due_date=?, status=?, notes=?, remind_days=?, user_id=COALESCE(user_id, ?)${reset ? ", reminded_before=NULL, reminded_due=NULL" : ""}${doneAt !== undefined ? ", done_at=?" : ""} WHERE id=?`,
      doneAt !== undefined ? [...vals, account, doneAt, oid] : [...vals, account, oid],
    );
  } else {
    await run(
      "INSERT INTO orders (id, title, client_name, client_email, service, amount, start_date, due_date, status, notes, remind_days, user_id, created_at, done_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id(), ...vals, account, Date.now(), status === "done" ? Date.now() : null],
    );
  }
  revalidatePath("/panel/admin", "layout");
  return { ok: true };
}

// usunięcie zlecenia sprząta po sobie: pliki (także z chmury), powiązania płatności i wyceny, a zapytanie wraca do „w kontakcie”
export async function deleteOrder(oid: string) {
  await requireAdmin();
  const { orderFiles, removeOrderFile } = await import("@/lib/deliver");
  for (const f of await orderFiles(oid)) await removeOrderFile(f.id);
  await run("UPDATE payments SET order_id = NULL WHERE order_id = ?", [oid]);
  await run("UPDATE offers SET order_id = NULL WHERE order_id = ?", [oid]);
  await run("UPDATE inquiries SET order_id = NULL, status = 'contacted' WHERE order_id = ?", [oid]);
  await run("DELETE FROM orders WHERE id = ?", [oid]);
  revalidatePath("/panel/admin", "layout");
  revalidatePath("/panel", "layout");
}

export async function setOrderStatus(oid: string, status: string) {
  await requireAdmin();
  if (!["planned", "active", "done", "cancelled"].includes(status)) return;
  await run("UPDATE orders SET status = ?, done_at = ? WHERE id = ? AND status != ?", [status, status === "done" ? Date.now() : null, oid, status]);
  revalidatePath("/panel/admin", "layout");
}

// ręczne sprawdzenie przypomnień (przycisk w kalendarzu)
export async function runReminders() {
  await requireAdmin();
  return sendReminders();
}
