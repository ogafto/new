import { createElement } from "react";
import VerifyEmail from "@/emails/VerifyEmail";
import { run, type User } from "../db";
import { baseUrl, sendMail } from "../mail";
import { otp, sha256 } from "./crypto";

export const VERIFY_MINUTES = 15;

// Nowy 6-cyfrowy kod weryfikacyjny (poprzedni przestaje działać)
export async function sendVerification(user: Pick<User, "id" | "email" | "name">) {
  const code = otp();
  const now = Date.now();
  await run(
    `INSERT INTO verification_codes (user_id, code_hash, expires_at, attempts, sent_at) VALUES (?, ?, ?, 0, ?)
     ON CONFLICT(user_id) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0, sent_at = excluded.sent_at`,
    [user.id, sha256(`${user.id}:${code}`), now + VERIFY_MINUTES * 60_000, now],
  );
  return sendMail({
    to: user.email,
    subject: `${code} — kod weryfikacyjny afto.works`,
    react: createElement(VerifyEmail, { name: user.name, code, baseUrl: baseUrl(), minutes: VERIFY_MINUTES }),
  });
}
