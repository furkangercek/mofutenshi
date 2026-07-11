import { cartStockCap, MAX_CART_QUANTITY } from "@/lib/cart-constants";
import { clearCartToken, readCartToken } from "@/lib/cart-cookie";
import { prisma } from "@/lib/prisma";

// PRD US-10: on login, the guest cookie cart merges into the user's DB cart —
// dedupe by variant, sum quantities capped at stock. Runs from the Auth.js
// signIn event, so it covers both credentials and OAuth logins.
export async function mergeGuestCartIntoUserCart(userId: string): Promise<void> {
  const token = await readCartToken();
  if (!token) return;

  const guestCart = await prisma.cart.findUnique({
    where: { sessionToken: token },
    select: {
      id: true,
      items: {
        select: {
          variantId: true,
          quantity: true,
          variant: { select: { stock: true, trackStock: true } },
        },
      },
    },
  });
  if (!guestCart) {
    await clearCartToken();
    return;
  }

  await prisma.$transaction(async (tx) => {
    const userCart = await tx.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { id: true },
    });

    for (const item of guestCart.items) {
      const stock = cartStockCap(item.variant);
      if (stock === 0) continue;
      const existing = await tx.cartItem.findUnique({
        where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
        select: { quantity: true },
      });
      const quantity = Math.min(
        (existing?.quantity ?? 0) + item.quantity,
        stock,
        MAX_CART_QUANTITY,
      );
      await tx.cartItem.upsert({
        where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
        create: { cartId: userCart.id, variantId: item.variantId, quantity },
        update: { quantity },
      });
    }

    await tx.cart.delete({ where: { id: guestCart.id } });
  });

  await clearCartToken();
}
