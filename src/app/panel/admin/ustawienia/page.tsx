import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { baseUrl } from "@/lib/mail";
import { GROUPS, SETTINGS, settingStates } from "@/lib/settings";
import { PageHead } from "@/components/panel/kit";
import SettingsForm from "@/components/panel/SettingsForm";

export const metadata: Metadata = { title: "Ustawienia" };

export default async function SettingsPage() {
  await requireAdmin();
  const [states, base] = await Promise.all([settingStates(), baseUrl()]);
  // to, co musi zostać w zmiennych środowiskowych (bez tego aplikacja nie wystartuje)
  const envOnly = [
    { key: "DATABASE_URL", label: "Baza danych", set: !!(process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL) },
    { key: "DATABASE_AUTH_TOKEN", label: "Token bazy", set: !!(process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN) },
    { key: "ADMIN_EMAIL", label: "E-mail admina", set: !!process.env.ADMIN_EMAIL },
    { key: "ADMIN_PASSWORD", label: "Hasło admina", set: !!process.env.ADMIN_PASSWORD },
    { key: "CRON_SECRET", label: "Sekret crona (Vercel)", set: !!process.env.CRON_SECRET },
    { key: "SECRET_KEY", label: "Klucz szyfrowania (opcjonalnie)", set: !!process.env.SECRET_KEY },
  ];
  return (
    <>
      <PageHead title="Ustawienia" />
      <SettingsForm
        groups={GROUPS}
        defs={SETTINGS.map(({ env, ...d }) => ({ ...d, env: env[0] }))}
        states={states}
        webhookUrl={`${base}/api/stripe/webhook`}
        envOnly={envOnly}
        secretKey={!!process.env.SECRET_KEY}
      />
    </>
  );
}
