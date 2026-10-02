/*
 * Ustawienia z env — jedno miejsce, z alternatywnymi nazwami
 * (np. ze starej strony: APP_URL, RESEND_FROM, TURSO_*).
 */
const pick = (...keys: string[]) => {
  for (const k of keys) {
    const v = process.env[k]?.trim();
    if (v) return v;
  }
  return "";
};

export const env = {
  siteUrl: () => pick("NEXT_PUBLIC_SITE_URL", "APP_URL", "SITE_URL"),
  dbUrl: () => pick("DATABASE_URL", "TURSO_DATABASE_URL", "LIBSQL_URL"),
  dbToken: () => pick("DATABASE_AUTH_TOKEN", "DATABASE_TOKEN", "TURSO_AUTH_TOKEN", "LIBSQL_AUTH_TOKEN"),
  mailFrom: () => pick("MAIL_FROM", "RESEND_FROM", "CONTACT_FROM"),
  contactFrom: () => pick("CONTACT_FROM", "RESEND_FROM", "MAIL_FROM"),
  blobToken: () => pick("BLOB_READ_WRITE_TOKEN"),
};
