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

  const vals = [title, client, v("client_email") || null, v("user_id") || null, v("service") || null, amount, start, due, status, v("notes", 3000) || null, remind];
  if (oid) {
    const prev = await one<{ due_date: string; remind_days: number }>("SELECT due_date, remind_days FROM orders WHERE id = ?", [oid]);
    // zmiana terminu → przypomnienia wyślą się ponownie
    const reset = prev && (prev.due_date !== due || prev.remind_days !== remind);
    await run(
      `UPDATE orders SET title=?, client_name=?, client_email=?, user_id=?, service=?, amount=?, start_date=?, due_date=?, status=?, notes=?, remind_days=?${reset ? ", reminded_before=NULL, reminded_due=NULL" : ""} WHERE id=?`,
      [...vals, oid],
    );
  } else {
    await run(
      "INSERT INTO orders (id, title, client_name, client_email, user_id, service, amount, start_date, due_date, status, notes, remind_days, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id(), ...vals, Date.now()],
    );
  }
  revalidatePath("/panel/admin", "layout");
  return { ok: true };
}

export async function deleteOrder(oid: string) {
  await requireAdmin();
  await run("DELETE FROM orders WHERE id = ?", [oid]);
  revalidatePath("/panel/admin", "layout");
}

export async function setOrderStatus(oid: string, status: string) {
  await requireAdmin();
  if (!["planned", "active", "done", "cancelled"].includes(status)) return;
  await run("UPDATE orders SET status = ? WHERE id = ?", [status, oid]);
  revalidatePath("/panel/admin", "layout");
}

// ręczne sprawdzenie przypomnień (przycisk w kalendarzu)
export async function runReminders() {
  await requireAdmin();
  return sendReminders();
}
