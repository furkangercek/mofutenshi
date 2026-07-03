import { auth } from "@/lib/auth";
import { readCartToken } from "@/lib/cart-cookie";

// A cart belongs to either a logged-in user or a signed guest cookie — both
// are unique columns on Cart, so the identity doubles as a findUnique filter.
export type CartIdentity = { userId: string } | { sessionToken: string };

export async function getCartIdentity(): Promise<CartIdentity | null> {
  const session = await auth();
  if (session?.user?.id) return { userId: session.user.id };
  const token = await readCartToken();
  return token ? { sessionToken: token } : null;
}

export function ownsCart(
  identity: CartIdentity,
  cart: { userId: string | null; sessionToken: string | null },
): boolean {
  if ("userId" in identity) return cart.userId === identity.userId;
  return cart.sessionToken === identity.sessionToken;
}
