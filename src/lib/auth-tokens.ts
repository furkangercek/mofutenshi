import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

// Single-use auth tokens on the Auth.js VerificationToken table (unused by
// the JWT session setup). The DB stores only a SHA-256 hash — the raw token
// exists solely inside the emailed link, so a DB leak exposes nothing usable.
// identifier = "<purpose>:<email>" keeps the two flows from crossing.

export type TokenPurpose = "verify-email" | "password-reset";

export const TOKEN_TTL_MS: Record<TokenPurpose, number> = {
  "verify-email": 24 * 60 * 60 * 1000,
  "password-reset": 60 * 60 * 1000,
};

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

// Issues a fresh token and invalidates any previous one for the same
// purpose+email (only the newest emailed link works).
export async function createAuthToken(purpose: TokenPurpose, email: string): Promise<string> {
  const identifier = `${purpose}:${email}`;
  const rawToken = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: {
        identifier,
        token: hashToken(rawToken),
        expires: new Date(Date.now() + TOKEN_TTL_MS[purpose]),
      },
    }),
  ]);
  return rawToken;
}

// Read-only validity check for rendering token-carrying pages; expired rows
// are cleaned up on sight. Returns the email or null.
export async function peekAuthToken(
  purpose: TokenPurpose,
  rawToken: string,
): Promise<string | null> {
  const row = await prisma.verificationToken.findUnique({
    where: { token: hashToken(rawToken) },
  });
  if (!row || !row.identifier.startsWith(`${purpose}:`)) return null;
  if (row.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { token: row.token } });
    return null;
  }
  return row.identifier.slice(purpose.length + 1);
}

// Burns the token (single use). deleteMany's count makes concurrent consumers
// race-safe: only one caller sees the row deleted. Returns the email or null.
export async function consumeAuthToken(
  purpose: TokenPurpose,
  rawToken: string,
): Promise<string | null> {
  const email = await peekAuthToken(purpose, rawToken);
  if (email === null) return null;
  const deleted = await prisma.verificationToken.deleteMany({
    where: { token: hashToken(rawToken) },
  });
  return deleted.count === 1 ? email : null;
}
