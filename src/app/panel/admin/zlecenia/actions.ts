"use server";

import { createElement } from "react";
import { revalidatePath } from "next/cache";
import { one, run } from "@/lib/db";
import { id } from "@/lib/auth/crypto";
import { requireAdmin } from "@/lib/auth/session";
import { addOrderFile, FILE_MAX, getOrder, removeOrderFile } from "@/lib/deliver";
import { log } from "@/lib/logs";
import { baseUrl, sendMail } from "@/lib/mail";
import { setting } from "@/lib/settings";
import { saveRawLocal } from "@/lib/storage";
import { createSite } from "@/app/panel/cms/actions";
import OrderDoneEmail from "@/emails/OrderDoneEmail";

type R = { ok?: string; error?: string };

const refresh = (oid: string) => {
  revalidatePath(`/panel/admin/zlecenia/${oid}`);
  revalidatePath("/panel/admin", "layout");
  revalidatePath("/panel", "layout");
};

/** Plik wgrany prosto z przeglądarki do Vercel Blob */
export async function registerOrderFile(f: { orderId: string; name: string; url: string; pathname: string; size: number; mime: string }): Promise<R> {
  const admin = await requireAdmin();
  if (!(await getOrder(f.orderId))) return { error: "Nie ma takiego zlecenia." };
  if (!/^https:\/\/[a-z0-9-]+\.(public|private)\.blob\.vercel-storage\.com\//.test(f.url)) return { error: "Nieprawidłowy adres pliku." };
  const token = await setting("blob_token");
  if (!token) return { error: "Brak tokenu Vercel Blob." };
  // pobieranie i tak idzie przez /api/pliki (sprawdza, czy to klient tego zlecenia) — adres pliku nie trafia do przeglądarki
  await addOrderFile({ id: id(), order_id: f.orderId, name: f.name.slice(0, 200), size: f.size, mime: f.mime || null, url: f.url, pathname: f.pathname });
  await log("client", `Plik dla klienta: ${f.name}`, { actor: admin.email });
  refresh(f.orderId);
  return { ok: "Dodano." };
}

/** Wgrywanie na dysk serwera (lokalnie / bez Vercel Blob) */
export async function uploadOrderLocal(form: FormData): Promise<R> {
  const admin = await requireAdmin();
  const orderId = String(form.get("orderId") ?? "");
  if (!(await getOrder(orderId))) return { error: "Nie ma takiego zlecenia." };
  const files = form.getAll("file").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "Wybierz plik." };
  for (const f of files) {
    if (f.size > FILE_MAX) return { error: `${f.name}: plik jest za duży (max 500 MB).` };
    try {
      const ext = (f.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
      const url = await saveRawLocal(f, "zlecenia", ext);
      await addOrderFile({ id: id(), order_id: orderId, name: f.name.slice(0, 200), size: f.size, mime: f.type || null, url, pathname: null });
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Nie udało się zapisać pliku." };
    }
  }
  await log("client", `Pliki dla klienta: ${files.map((f) => f.name).join(", ")}`, { actor: admin.email });
  refresh(orderId);
  return { ok: files.length > 1 ? `Dodano ${files.length} pliki.` : "Dodano." };
}

export async function deleteOrderFile(fid: string): Promise<R> {
  await requireAdmin();
  const f = await removeOrderFile(fid);
  if (f) refresh(f.order_id);
  return { ok: "Usunięto." };
}

/** Status zlecenia i wiadomość widoczna dla klienta; przy oddaniu opcjonalnie mail „pliki czekają” */
export async function updateOrder(oid: string, d: { status?: "planned" | "active" | "done" | "cancelled"; client_note?: string; notify?: boolean }): Promise<R & { mailed?: boolean }> {
  const admin = await requireAdmin();
  const o = await getOrder(oid);
  if (!o) return { error: "Nie ma takiego zlecenia." };
  if (d.status && !["planned", "active", "done", "cancelled"].includes(d.status)) return { error: "Nieprawidłowy status." };
  if (d.status && d.status !== o.status) {
    await run("UPDATE orders SET status = ?, done_at = ? WHERE id = ?", [d.status, d.status === "done" ? Date.now() : null, oid]);
    await log("client", `Zlecenie „${o.title}”: ${{ planned: "zaplanowane", active: "w realizacji", done: "oddane", cancelled: "anulowane" }[d.status]}`, { level: d.status === "done" ? "success" : "info", actor: admin.email });
  }
  if (d.client_note !== undefined) await run("UPDATE orders SET client_note = ? WHERE id = ?", [d.client_note.trim().slice(0, 2000) || null, oid]);
  let mailed = false;
  if (d.notify && d.status === "done" && o.client_email) {
    const base = await baseUrl();
    const files = await one<{ n: number }>("SELECT COUNT(*) n FROM order_files WHERE order_id = ?", [oid]);
    const r = await sendMail({
      to: o.client_email,
      subject: `Gotowe: ${o.title}`,
      react: createElement(OrderDoneEmail, { name: o.client_name, title: o.title, files: Number(files?.n ?? 0), note: d.client_note ?? o.client_note ?? null, url: `${base}/panel/zamowienia/${oid}`, baseUrl: base }),
    });
    mailed = r.ok;
  }
  refresh(oid);
  return { ok: "Zapisano.", mailed };
}

/** Podpięcie istniejącej strony (CMS) do zlecenia — klient zobaczy edycję w swoim zleceniu */
export async function linkOrderSite(oid: string, siteId: string | null): Promise<R> {
  await requireAdmin();
  const o = await getOrder(oid);
  if (!o) return { error: "Nie ma takiego zlecenia." };
  if (siteId) {
    const s = await one<{ id: string; owner_id: string | null }>("SELECT id, owner_id FROM cms_sites WHERE id = ?", [siteId]);
    if (!s) return { error: "Nie ma takiej strony." };
    // właścicielem strony zostaje klient zlecenia, żeby mógł ją edytować
    if (o.user_id && s.owner_id !== o.user_id) await run("UPDATE cms_sites SET owner_id = ? WHERE id = ?", [o.user_id, siteId]);
  }
  await run("UPDATE orders SET site_id = ? WHERE id = ?", [siteId, oid]);
  refresh(oid);
  revalidatePath("/panel/admin/strony");
  return { ok: siteId ? "Podpięto stronę." : "Odpięto stronę." };
}

/** Nowa strona w CMS od razu dla klienta tego zlecenia (z gotowym zestawem sekcji) */
export async function createOrderSite(oid: string, d: { name: string; domain: string; preset: string }): Promise<R & { siteId?: string }> {
  await requireAdmin();
  const o = await getOrder(oid);
  if (!o) return { error: "Nie ma takiego zlecenia." };
  if (!o.user_id) return { error: "Klient nie ma jeszcze konta w panelu — zaproś go (Klienci → Zaproś), a potem podepnij stronę." };
  const fd = new FormData();
  fd.set("name", d.name || o.title);
  fd.set("domain", d.domain);
  fd.set("owner", o.user_id);
  fd.set("preset", d.preset || "firma");
  const r = await createSite(undefined, fd);
  if (!r?.id) return { error: r?.error ?? "Nie udało się utworzyć strony." };
  await run("UPDATE orders SET site_id = ? WHERE id = ?", [r.id, oid]);
  refresh(oid);
  return { ok: "Utworzono stronę.", siteId: r.id };
}
