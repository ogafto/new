import { render } from "@react-email/render";
import { Resend } from "resend";
import { site } from "./site";
import { setting } from "./settings";
import { log } from "./logs";

export const baseUrl = async () => ((await setting("site_url")) || site.url).replace(/\/$/, "");

/**
 * Wysyła mail przez Resend. Bez klucza (dev) wypisuje treść w konsoli serwera,
 * żeby dało się przetestować rejestrację lokalnie.
 */
export async function sendMail({ to, subject, react }: { to: string; subject: string; react: React.ReactElement }) {
  const [html, text] = await Promise.all([render(react), render(react, { plainText: true })]);
  const key = await setting("resend_api_key");

  if (!key) {
    if (process.env.NODE_ENV === "production") return { ok: false as const, dev: false };
    console.log(`\n✉️  [dev] ${subject} → ${to}\n${text}\n`);
    return { ok: true as const, dev: true };
  }

  const { error } = await new Resend(key).emails.send({
    from: (await setting("mail_from")) || `${site.domain} <konto@${site.domain}>`,
    to,
    subject,
    html,
    text,
  });
  if (error) {
    console.error("Resend:", error.message);
    await log("mail", `Nie wysłano maila „${subject}” do ${to}`, { level: "error", meta: { error: error.message } });
    return { ok: false as const, dev: false };
  }
  return { ok: true as const, dev: false };
}
