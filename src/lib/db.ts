import { mkdirSync } from "node:fs";
import { createClient, type Client, type InValue } from "@libsql/client";

/*
 * Baza: libSQL. Lokalnie plik (data/afto.db), na produkcji Turso
 * (DATABASE_URL=libsql://… + DATABASE_AUTH_TOKEN). Schemat tworzy się sam przy starcie.
 */

const url = process.env.DATABASE_URL || "file:./data/afto.db";

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
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
  `CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id)`,
  `CREATE INDEX IF NOT EXISTS invites_email ON invites(email)`,
];

const g = globalThis as unknown as { __afto_db?: Promise<Client> };

async function init() {
  if (url.startsWith("file:")) mkdirSync("data", { recursive: true });
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
  await client.batch(["PRAGMA foreign_keys = ON", ...SCHEMA], "write");
  return client;
}

export function db() {
  g.__afto_db ??= init().catch((e) => {
    g.__afto_db = undefined;
    throw e;
  });
  return g.__afto_db;
}

export async function one<T>(sql: string, args: InValue[] = []) {
  const r = await (await db()).execute({ sql, args });
  return (r.rows[0] as unknown as T) ?? null;
}

export async function all<T>(sql: string, args: InValue[] = []) {
  const r = await (await db()).execute({ sql, args });
  return r.rows as unknown as T[];
}

export async function run(sql: string, args: InValue[] = []) {
  return (await db()).execute({ sql, args });
}

export type User = {
  id: string;
  email: string;
  name: string;
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
