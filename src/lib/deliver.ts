import { all, one, run } from "./db";
import type { Order } from "./orders";
import type { User } from "./db";
import { isAdmin } from "./auth/session";
import { setting } from "./settings";
import { blobDelete, removeLocal } from "./storage";

/* Zlecenia od strony „dostawy”: pliki do pobrania, dostęp klienta, płatności i strona (CMS) przypięte do zlecenia. */

export type OrderFile = { id: string; order_id: string; name: string; size: number; mime: string | null; url: string; pathname: string | null; created_at: number };

export const FILE_MAX = 500 * 1024 * 1024;

export async function getOrder(id: string) {
  const o = await one<Order>("SELECT * FROM orders WHERE id = ?", [id]);
  return o ? { ...o, amount: o.amount == null ? null : Number(o.amount) } : null;
}

// klient widzi tylko swoje zlecenia (konto albo e-mail z zamówienia), admin wszystkie
export function canSee(user: Pick<User, "id" | "email" | "role">, o: Pick<Order, "user_id" | "client_email">) {
  return isAdmin(user) || o.user_id === user.id || (!!o.client_email && o.client_email.toLowerCase() === user.email.toLowerCase());
}

export async function orderFiles(orderId: string) {
  return (await all<OrderFile>("SELECT * FROM order_files WHERE order_id = ? ORDER BY created_at DESC", [orderId])).map((f) => ({ ...f, size: Number(f.size), created_at: Number(f.created_at) }));
}

export async function fileCounts() {
  const rows = await all<{ order_id: string; n: number }>("SELECT order_id, COUNT(*) n FROM order_files GROUP BY order_id");
  return Object.fromEntries(rows.map((r) => [r.order_id, Number(r.n)]));
}

export async function addOrderFile(f: Omit<OrderFile, "created_at">) {
  await run("INSERT INTO order_files (id, order_id, name, size, mime, url, pathname, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [f.id, f.order_id, f.name, f.size, f.mime, f.url, f.pathname, Date.now()]);
}

export async function removeOrderFile(fid: string) {
  const f = await one<OrderFile>("SELECT * FROM order_files WHERE id = ?", [fid]);
  if (!f) return null;
  await run("DELETE FROM order_files WHERE id = ?", [fid]);
  if (f.url.startsWith("https://")) {
    const token = await setting("blob_token");
    if (token) await blobDelete(f.url, token).catch(() => {});
  } else await removeLocal(f.url).catch(() => {});
  return f;
}

export async function orderPayments(o: Pick<Order, "id">) {
  return all<{ id: string; title: string; amount: number; status: "pending" | "paid"; due_date: string | null; paid_at: number | null; stripe_url: string | null; stripe_session: string | null; method: "stripe" | "transfer" | "cash" }>(
    "SELECT id, title, amount, status, due_date, paid_at, stripe_url, stripe_session, method FROM payments WHERE order_id = ? AND status IN ('pending', 'paid') ORDER BY created_at",
    [o.id],
  );
}

export const fileKind = (name: string, mime?: string | null) => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (/^(zip|rar|7z|tar|gz)$/.test(ext)) return "archiwum";
  if (/^(png|jpe?g|webp|gif|svg|avif|heic)$/.test(ext) || mime?.startsWith("image/")) return "grafika";
  if (/^(mp4|mov|webm|m4v)$/.test(ext) || mime?.startsWith("video/")) return "wideo";
  if (/^(pdf)$/.test(ext)) return "pdf";
  if (/^(fig|psd|ai|sketch|xd|eps)$/.test(ext)) return "projekt";
  if (/^(ttf|otf|woff2?)$/.test(ext)) return "font";
  return "plik";
};

export const fmtSize = (b: number) => (b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : b >= 1e3 ? `${Math.round(b / 1e3)} kB` : `${b} B`);
