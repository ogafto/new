import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { all, run } from "./db";

/*
 * Ustawienia z panelu admina (zamiast .env.local).
 * Kolejność odczytu: wartość z panelu → zmienna środowiskowa (stare wdrożenia dalej działają).
 * Sekrety (klucze API, webhooki) są w bazie zaszyfrowane AES-256-GCM.
 *
 * W env zostaje tylko to, bez czego aplikacja nie wystartuje albo czego używa sam Vercel:
 * DATABASE_URL, DATABASE_AUTH_TOKEN, ADMIN_EMAIL, ADMIN_PASSWORD, CRON_SECRET (opcjonalnie SECRET_KEY).
 */

export type SettingGroup = "general" | "mail" | "discord" | "stripe" | "analytics" | "storage";

export type SettingDef = {
  key: string;
  group: SettingGroup;
  label: string;
  hint?: string;
  placeholder?: string;
  secret?: boolean;
  env: string[];
  type?: "text" | "email" | "url";
};

export const GROUPS: { id: SettingGroup; title: string; text: string }[] = [
  { id: "general", title: "Ogólne", text: "Adres strony i powiadomienia." },
  { id: "mail", title: "E-mail (Resend)", text: "Wysyłka zaproszeń, kodów weryfikacyjnych, formularza i przypomnień." },
  { id: "discord", title: "Discord", text: "Powiadomienia o nowych zapytaniach i płatnościach na kanał." },
  { id: "stripe", title: "Płatności (Stripe)", text: "Linki do płatności dla klientów i automatyczne księgowanie wpłat." },
  { id: "analytics", title: "Analityka i SEO", text: "Google Analytics, weryfikacja Search Console, sól anonimowych statystyk." },
  { id: "storage", title: "Pliki", text: "Gdzie trafiają zdjęcia wgrywane w panelu." },
];

export const SETTINGS: SettingDef[] = [
  { key: "site_url", group: "general", label: "Adres strony", placeholder: "https://afto.works", env: ["NEXT_PUBLIC_SITE_URL", "APP_URL", "SITE_URL"], type: "url", hint: "Używany w linkach w mailach i w płatnościach." },
  { key: "admin_name", group: "general", label: "Twoje imię w panelu", placeholder: "Wojtek", env: ["ADMIN_NAME"] },
  { key: "notify_email", group: "general", label: "E-mail do powiadomień", placeholder: "ty@afto.works", env: ["NOTIFY_EMAIL"], type: "email", hint: "Przypomnienia z kalendarza i informacje o wpłatach. Puste = e-mail admina." },

  { key: "resend_api_key", group: "mail", label: "Klucz API Resend", placeholder: "re_…", env: ["RESEND_API_KEY"], secret: true, hint: "resend.com → API Keys. Domena nadawcy musi być zweryfikowana." },
  { key: "mail_from", group: "mail", label: "Nadawca maili z kontem", placeholder: "afto.works <konto@afto.works>", env: ["MAIL_FROM", "RESEND_FROM", "CONTACT_FROM"] },
  { key: "contact_from", group: "mail", label: "Nadawca maili z formularza", placeholder: "afto.works <formularz@afto.works>", env: ["CONTACT_FROM", "RESEND_FROM", "MAIL_FROM"] },
  { key: "contact_to", group: "mail", label: "Gdzie wysyłać zapytania", placeholder: "ty@afto.works", env: ["CONTACT_TO"], type: "email", hint: "Puste = e-mail z treści strony." },

  { key: "discord_webhook", group: "discord", label: "Webhook kanału", placeholder: "https://discord.com/api/webhooks/…", env: ["DISCORD_WEBHOOK_URL"], secret: true, hint: "Ustawienia kanału → Integracje → Webhooki → Kopiuj URL." },

  { key: "stripe_secret_key", group: "stripe", label: "Klucz tajny", placeholder: "sk_live_… albo sk_test_…", env: ["STRIPE_SECRET_KEY"], secret: true, hint: "Stripe → Developers → API keys. Możesz zacząć od klucza testowego (sk_test_)." },
  { key: "stripe_webhook_secret", group: "stripe", label: "Sekret webhooka", placeholder: "whsec_…", env: ["STRIPE_WEBHOOK_SECRET"], secret: true, hint: "Stripe → Developers → Webhooks → dodaj adres podany niżej, zdarzenia checkout.session.*." },

  { key: "ga_id", group: "analytics", label: "Google Analytics 4 — ID", placeholder: "G-XXXXXXXXXX", env: ["NEXT_PUBLIC_GA_ID"], hint: "Ładuje się dopiero po zgodzie na cookies analityczne." },
  { key: "google_verification", group: "analytics", label: "Google Search Console — kod weryfikacji", placeholder: "abc123…", env: ["NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION"], hint: "Sama wartość content z tagu meta." },
  { key: "analytics_salt", group: "analytics", label: "Sól statystyk", placeholder: "dowolny losowy ciąg", env: ["ANALYTICS_SALT"], secret: true, hint: "Zmiana resetuje liczenie unikalnych odwiedzających." },

  { key: "blob_token", group: "storage", label: "Vercel Blob — token", placeholder: "vercel_blob_rw_…", env: ["BLOB_READ_WRITE_TOKEN"], secret: true, hint: "Wymagany na Vercelu (dysk serwera nie jest trwały). Vercel → Storage → Blob." },
];

export const settingDef = (key: string) => SETTINGS.find((s) => s.key === key);

/* ---------- szyfrowanie ---------- */

function cryptoKey() {
  const base = process.env.SECRET_KEY || process.env.ADMIN_PASSWORD || process.env.DATABASE_AUTH_TOKEN || "afto";
  return createHash("sha256").update(`afto-settings:${base}`).digest();
}

function encrypt(v: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", cryptoKey(), iv);
  const ct = Buffer.concat([c.update(v, "utf8"), c.final()]);
  return `v1:${iv.toString("base64")}:${c.getAuthTag().toString("base64")}:${ct.toString("base64")}`;
}

function decrypt(v: string): string | null {
  try {
    const [ver, iv, tag, ct] = v.split(":");
    if (ver !== "v1") return null;
    const d = createDecipheriv("aes-256-gcm", cryptoKey(), Buffer.from(iv, "base64"));
    d.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([d.update(Buffer.from(ct, "base64")), d.final()]).toString("utf8");
  } catch {
    return null; // np. po zmianie ADMIN_PASSWORD bez SECRET_KEY — trzeba wpisać sekret ponownie
  }
}

/* ---------- odczyt z krótką pamięcią podręczną ---------- */

type Row = { key: string; value: string; secret: number; updated_at: number };
type Cache = { at: number; rows: Map<string, Row> };
const g = globalThis as unknown as { __afto_settings?: Cache };
const TTL = 30_000;

async function rows() {
  const c = g.__afto_settings;
  if (c && Date.now() - c.at < TTL) return c.rows;
  const list = await all<Row>("SELECT key, value, secret, updated_at FROM settings").catch(() => [] as Row[]);
  const map = new Map(list.map((r) => [r.key, r]));
  g.__afto_settings = { at: Date.now(), rows: map };
  return map;
}

const fromEnv = (def?: SettingDef) => {
  for (const k of def?.env ?? []) {
    const v = process.env[k]?.trim();
    if (v) return v;
  }
  return "";
};

/** Wartość ustawienia: panel → env → "" */
export async function setting(key: string): Promise<string> {
  const def = settingDef(key);
  const row = (await rows()).get(key);
  if (row) {
    const v = row.secret ? decrypt(row.value) : row.value;
    if (v) return v;
  }
  return fromEnv(def);
}

export async function settings<K extends string>(...keys: K[]) {
  const values = await Promise.all(keys.map((k) => setting(k)));
  return Object.fromEntries(keys.map((k, i) => [k, values[i]])) as Record<K, string>;
}

export type SettingState = { key: string; source: "panel" | "env" | "none"; preview: string; broken?: boolean; updatedAt?: number };

const mask = (v: string) => (v.length <= 8 ? "••••" : `${v.slice(0, 4)}••••${v.slice(-4)}`);

/** Stan ustawień dla panelu — bez ujawniania sekretów */
export async function settingStates(): Promise<SettingState[]> {
  const map = await rows();
  return SETTINGS.map((def) => {
    const row = map.get(def.key);
    if (row) {
      const v = row.secret ? decrypt(row.value) : row.value;
      if (v === null) return { key: def.key, source: "panel", preview: "", broken: true, updatedAt: row.updated_at };
      return { key: def.key, source: "panel", preview: def.secret ? mask(v) : v, updatedAt: row.updated_at };
    }
    const e = fromEnv(def);
    return { key: def.key, source: e ? "env" : "none", preview: e ? (def.secret ? mask(e) : e) : "" };
  });
}

export async function saveSetting(key: string, value: string) {
  const def = settingDef(key);
  if (!def) throw new Error(`Nieznane ustawienie: ${key}`);
  const v = value.trim();
  if (!v) await run("DELETE FROM settings WHERE key = ?", [key]);
  else
    await run("INSERT INTO settings (key, value, secret, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, secret = excluded.secret, updated_at = excluded.updated_at", [
      key,
      def.secret ? encrypt(v) : v,
      def.secret ? 1 : 0,
      Date.now(),
    ]);
  g.__afto_settings = undefined;
}

export const clearSettingsCache = () => {
  g.__afto_settings = undefined;
};
