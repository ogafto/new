import { render } from "@react-email/render";
import { Resend } from "resend";
import { site } from "./site";
import { env } from "./env";

export const baseUrl = () => (env.siteUrl() || site.url).replace(/\/$/, "");

/**
 * Wysyła mail przez Resend. Bez klucza (dev) wypisuje treść w konsoli serwera,
 * żeby dało się przetestować rejestrację lokalnie.
 */
export async function sendMail({ to, subject, react }: { to: string; subject: string; react: React.ReactElement }) {
  const [html, text] = await Promise.all([render(react), render(react, { plainText: true })]);
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    if (process.env.NODE_ENV === "production") return { ok: false as const, dev: false };
    console.log(`\n✉️  [dev] ${subject} → ${to}\n${text}\n`);
    return { ok: true as const, dev: true };
  }

  const { error } = await new Resend(key).emails.send({
    from: env.mailFrom() || `${site.domain} <konto@${site.domain}>`,
    to,
    subject,
    html,
    text,
  });
  if (error) {
    console.error("Resend:", error.message);
    return { ok: false as const, dev: false };
  }
  return { ok: true as const, dev: false };
}
