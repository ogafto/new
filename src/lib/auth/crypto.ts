import { createHash, randomBytes, randomInt, randomUUID, scrypt, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;

function scryptAsync(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, KEYLEN, { N: 16384, r: 8, p: 1 }, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [, salt, key] = stored.split("$");
  if (!salt || !key) return false;
  const expected = Buffer.from(key, "base64");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64"));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
export const token = () => randomBytes(32).toString("base64url");
export const id = () => randomUUID();

// Kod zaproszenia: XXXX-XXXX bez mylących znaków (0/O, 1/I/L)
const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function inviteCode() {
  const c = Array.from({ length: 8 }, () => ALPHA[randomInt(ALPHA.length)]).join("");
  return `${c.slice(0, 4)}-${c.slice(4)}`;
}
export const normalizeCode = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "");

export const otp = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
