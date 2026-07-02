import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Guest cart identity: an opaque random token, HMAC-signed so a forged or
// tampered cookie can never address someone else's cart (PRD §11).
const COOKIE_NAME = "mofu_cart";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 60;

function sign(token: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET must be set to sign cart cookies");
  return createHmac("sha256", secret).update(token).digest("base64url");
}

export async function readCartToken(): Promise<string | null> {
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const separator = raw.lastIndexOf(".");
  if (separator <= 0) return null;
  const token = raw.slice(0, separator);
  const signature = Buffer.from(raw.slice(separator + 1));
  const expected = Buffer.from(sign(token));
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return null;
  return token;
}

// Only callable where cookies may be written (server actions, route handlers).
export async function issueCartToken(): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  (await cookies()).set(COOKIE_NAME, `${token}.${sign(token)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return token;
}
