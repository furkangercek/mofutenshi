import { createHmac, timingSafeEqual } from "node:crypto";

// Confirmation pages are reachable by guests with no session, so the link
// carries an HMAC of the order id — sequential order numbers must never be
// enough to read someone else's order.
function sign(orderId: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET must be set to sign order tokens");
  return createHmac("sha256", secret).update(`order:${orderId}`).digest("base64url");
}

export function orderAccessToken(orderId: string): string {
  return sign(orderId);
}

export function verifyOrderAccessToken(orderId: string, token: string): boolean {
  const expected = Buffer.from(sign(orderId));
  const given = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
