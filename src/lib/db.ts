import { mkdirSync } from "node:fs";
import { createClient, type Client, type InValue } from "@libsql/client";

/*
 * Baza: libSQL. Lokalnie plik (data/afto.db), na produkcji Turso
 * (DATABASE_URL=libsql://… + DATABASE_AUTH_TOKEN). Schemat tworzy się sam przy starcie.
 */

import { env } from "./env";

// Na Vercelu dysk jest tylko do odczytu — baza musi być zewnętrzna (Turso, libsql://…)
const url = env.dbUrl() || (process.env.VERCEL ? "" : "file:./data/afto.db");

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client',
    invite_id TEXT,
    project TEXT,
    stage INTEGER NOT NULL DEFAULT 0,
    verified_at INTEGER,
    created_at INTEGER NOT NULL,
    last_login_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS invites (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    code_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    sent_count INTEGER NOT NULL DEFAULT 1,
    used_at INTEGER,
    revoked_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS verification_codes (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    sent_at INTEGER NOT NULL
  )`,
  // portfolio
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    year TEXT NOT NULL,
    client TEXT NOT NULL,
    description TEXT NOT NULL,
    scope TEXT NOT NULL DEFAULT '[]',
    palette TEXT NOT NULL DEFAULT '[]',
    image TEXT NOT NULL,
    gallery TEXT NOT NULL DEFAULT '[]',
    url TEXT,
    featured INTEGER NOT NULL DEFAULT 1,
    published INTEGER NOT NULL DEFAULT 1,
    sort INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  // zapytania z formularza
  `CREATE TABLE IF NOT EXISTS inquiries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    topic TEXT,
    budget TEXT,
    timeline TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    note TEXT,
    created_at INTEGER NOT NULL
  )`,
  // analityka (bez ciasteczek: odwiedzający = dobowy skrót IP + przeglądarki)
  `CREATE TABLE IF NOT EXISTS pageviews (
    id TEXT PRIMARY KEY,
    visitor TEXT NOT NULL,
    session TEXT NOT NULL,
    path TEXT NOT NULL,
    referrer TEXT,
    ref_host TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    device TEXT,
    browser TEXT,
    os TEXT,
    country TEXT,
    lang TEXT,
    screen INTEGER,
    ts INTEGER NOT NULL,
    duration INTEGER NOT NULL DEFAULT 0,
    scroll INTEGER NOT NULL DEFAULT 0,
    section TEXT,
    seen INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pv TEXT NOT NULL,
    session TEXT NOT NULL,
    visitor TEXT NOT NULL,
    type TEXT NOT NULL,
    label TEXT,
    value TEXT,
    path TEXT,
    ts INTEGER NOT NULL
  )`,
  // kalendarz zleceń
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    user_id TEXT,
    service TEXT,
    amount INTEGER,
    start_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planned',
    notes TEXT,
    remind_days INTEGER NOT NULL DEFAULT 3,
    reminded_before INTEGER,
    reminded_due INTEGER,
    created_at INTEGER NOT NULL
  )`,
  // CMS dla stron klientów
  `CREATE TABLE IF NOT EXISTS cms_sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    owner_id TEXT,
    public_key TEXT NOT NULL UNIQUE,
    webhook_url TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS cms_collections (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'single',
    fields TEXT NOT NULL DEFAULT '[]',
    sort INTEGER NOT NULL DEFAULT 0,
    UNIQUE(site_id, key)
  )`,
  `CREATE TABLE IF NOT EXISTS cms_entries (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL REFERENCES cms_collections(id) ON DELETE CASCADE,
    data TEXT NOT NULL DEFAULT '{}',
    sort INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL,
    updated_by TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)`,
  // ustawienia z panelu (zamiast .env) — sekrety zaszyfrowane
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    secret INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  )`,
  // dziennik zdarzeń
  `CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    ts INTEGER NOT NULL,
    level TEXT NOT NULL DEFAULT 'info',
    kind TEXT NOT NULL,
    message TEXT NOT NULL,
    meta TEXT,
    actor TEXT,
    ip TEXT
  )`,
  // finanse: płatności (przychody) i koszty
  `CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    user_id TEXT,
    order_id TEXT,
    service TEXT,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'pln',
    status TEXT NOT NULL DEFAULT 'pending',
    method TEXT NOT NULL DEFAULT 'stripe',
    due_date TEXT,
    paid_at INTEGER,
    stripe_session TEXT,
    stripe_url TEXT,
    stripe_payment TEXT,
    notes TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'inne',
    amount INTEGER NOT NULL,
    date TEXT NOT NULL,
    recurring INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at INTEGER NOT NULL
  )`,
  // biblioteka marki: wgrane animacje/grafiki i własne kolory
  `CREATE TABLE IF NOT EXISTS brand_assets (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    kind TEXT NOT NULL,
    bytes INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS brand_colors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    hex TEXT NOT NULL,
    note TEXT,
    created_at INTEGER NOT NULL
  )`,
  // pliki oddawane klientowi w zleceniu (do pobrania w panelu klienta)
  `CREATE TABLE IF NOT EXISTS order_files (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    name TEXT NOT NULL,
    size INTEGER NOT NULL DEFAULT 0,
    mime TEXT,
    url TEXT NOT NULL,
    pathname TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS afto_ofiles_order ON order_files(order_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS afto_sessions_user ON sessions(user_id)`,
  `CREATE INDEX IF NOT EXISTS afto_invites_email ON invites(email)`,
  `CREATE INDEX IF NOT EXISTS afto_pv_ts ON pageviews(ts)`,
  `CREATE INDEX IF NOT EXISTS afto_pv_session ON pageviews(session)`,
  `CREATE INDEX IF NOT EXISTS afto_pv_visitor ON pageviews(visitor, ts)`,
  `CREATE INDEX IF NOT EXISTS afto_ev_ts ON events(ts)`,
  `CREATE INDEX IF NOT EXISTS afto_ev_session ON events(session)`,
  `CREATE INDEX IF NOT EXISTS afto_orders_due ON orders(due_date)`,
  `CREATE INDEX IF NOT EXISTS afto_entries_col ON cms_entries(collection_id, sort)`,
  `CREATE INDEX IF NOT EXISTS afto_logs_ts ON logs(ts)`,
  `CREATE INDEX IF NOT EXISTS afto_brand_cat ON brand_assets(category, created_at)`,
  `CREATE INDEX IF NOT EXISTS afto_payments_status ON payments(status, created_at)`,
  `CREATE INDEX IF NOT EXISTS afto_payments_session ON payments(stripe_session)`,
  `CREATE INDEX IF NOT EXISTS afto_expenses_date ON expenses(date)`,
];

// kolumny dodane później — dopisywane do istniejących baz
/*
 * Wszystkie tabele mają prefiks „afto_”, żeby nie kolidowały z tabelami innych aplikacji
 * w tej samej bazie (np. ze starej strony). Zapytania piszemy z krótkimi nazwami — prefiks
 * dokleja się automatycznie.
 */
const PREFIX = "afto_";
const TABLES = ["users", "sessions", "invites", "verification_codes", "projects", "inquiries", "pageviews", "events", "orders", "cms_sites", "cms_collections", "cms_entries", "meta", "settings", "logs", "payments", "expenses", "brand_assets", "brand_colors", "order_files"];
// tylko odwołania do tabel (po FROM/JOIN/INTO/UPDATE/…), nie aliasy kolumn typu „COUNT(*) pageviews”
const TABLE_RE = new RegExp(`\\b(FROM|JOIN|INTO|UPDATE|EXISTS|REFERENCES|ON|TABLE)(\\s+)(${TABLES.join("|")})\\b`, "gi");
export const sql = (q: string) => q.replace(TABLE_RE, (_, kw, sp, t) => `${kw}${sp}${PREFIX}${t}`);

const COLUMNS: Record<string, Record<string, string>> = {
  users: { phone: "TEXT" },
  pageviews: { seen: "INTEGER" },
  projects: { seo_title: "TEXT", seo_description: "TEXT" },
  inquiries: { user_id: "TEXT", source: "TEXT", order_id: "TEXT" },
  orders: { site_id: "TEXT", client_note: "TEXT", done_at: "INTEGER" },
};

async function migrate(client: Client) {
  for (const [table, cols] of Object.entries(COLUMNS)) {
    const info = await client.execute(`PRAGMA table_info(${PREFIX}${table})`);
    const have = new Set(info.rows.map((r) => String(r.name)));
    for (const [col, type] of Object.entries(cols)) if (!have.has(col)) await client.execute(`ALTER TABLE ${PREFIX}${table} ADD COLUMN ${col} ${type}`);
  }
}

// podbij przy zmianie schematu — serwer dev przeładuje połączenie i dopisze tabele
const VERSION = 10;
const g = globalThis as unknown as { __afto_db?: Promise<Client>; __afto_v?: number };

async function init() {
  if (!url) throw new Error("Brak DATABASE_URL — na Vercelu ustaw bazę Turso (libsql://…) i DATABASE_AUTH_TOKEN.");
  if (/^postgres(ql)?:/.test(url)) throw new Error("DATABASE_URL wskazuje na Postgresa — ta strona używa bazy libSQL/Turso (adres libsql://…).");
  if (url.startsWith("file:")) mkdirSync("data", { recursive: true });
  const client = createClient({ url, authToken: env.dbToken() || undefined });
  await client.execute("PRAGMA foreign_keys = ON").catch(() => {});
  await client.batch(SCHEMA.map(sql), "write");
  await migrate(client);
  return client;
}

export function db() {
  if (g.__afto_v !== VERSION) {
    g.__afto_db = undefined;
    g.__afto_v = VERSION;
  }
  g.__afto_db ??= init().catch((e) => {
    g.__afto_db = undefined;
    throw e;
  });
  return g.__afto_db;
}

export async function one<T>(q: string, args: InValue[] = []) {
  const r = await (await db()).execute({ sql: sql(q), args });
  return (r.rows[0] as unknown as T) ?? null;
}

export async function all<T>(q: string, args: InValue[] = []) {
  const r = await (await db()).execute({ sql: sql(q), args });
  return r.rows as unknown as T[];
}

export async function run(q: string, args: InValue[] = []) {
  return (await db()).execute({ sql: sql(q), args });
}

export type User = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  password: string;
  role: "client" | "admin";
  invite_id: string | null;
  project: string | null;
  stage: number;
  verified_at: number | null;
  created_at: number;
  last_login_at: number | null;
};

export type Invite = {
  id: string;
  email: string;
  name: string | null;
  code_hash: string;
  created_at: number;
  expires_at: number;
  sent_count: number;
  used_at: number | null;
  revoked_at: number | null;
};
