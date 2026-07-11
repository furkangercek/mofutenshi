"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { cartStockCap, MAX_CART_QUANTITY } from "@/lib/cart-constants";
import { issueCartToken } from "@/lib/cart-cookie";
import { getCartIdentity, ownsCart } from "@/lib/cart-identity";
import { cartCopy } from "@/lib/copy/cart";
import { prisma } from "@/lib/prisma";

export type CartActionResult = { ok: true; capped: boolean } | { ok: false; error: string };

const addSchema = z.object({
  variantId: z.cuid(),
  quantity: z.number().int().min(1).max(MAX_CART_QUANTITY).default(1),
});

export async function addCartItem(input: unknown): Promise<CartActionResult> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: cartCopy.addError };
  const { variantId, quantity } = parsed.data;

  const variant = await prisma.variant.findUnique({
    where: { id: variantId },
    select: {
      stock: true,
      trackStock: true,
      isActive: true,
      product: { select: { status: true } },
    },
  });
  if (!variant?.isActive || variant.product.status !== "PUBLISHED")
    return { ok: false, error: cartCopy.addError };
  if (cartStockCap(variant) < 1) return { ok: false, error: cartCopy.addOutOfStock };

  const identity = await getCartIdentity();
  let cart = identity
    ? await prisma.cart.findUnique({ where: identity, select: { id: true } })
    : null;
  if (!cart) {
    const owner =
      identity && "userId" in identity ? identity : { sessionToken: await issueCartToken() };
    cart = await prisma.cart.create({ data: owner, select: { id: true } });
  }

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    select: { quantity: true },
  });
  const requested = (existing?.quantity ?? 0) + quantity;
  const nextQuantity = Math.min(requested, cartStockCap(variant), MAX_CART_QUANTITY);
  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, variantId, quantity: nextQuantity },
    update: { quantity: nextQuantity },
  });

  refresh();
  return { ok: true, capped: nextQuantity < requested };
}

const updateSchema = z.object({
  itemId: z.cuid(),
  quantity: z.number().int().min(0).max(MAX_CART_QUANTITY),
});

// Ownership: the item must belong to the cart named by this request's session
// or signed cookie — an item id alone must never authorize a mutation.
async function findOwnedItem(itemId: string) {
  const identity = await getCartIdentity();
  if (!identity) return null;
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      cart: { select: { userId: true, sessionToken: true } },
      variant: { select: { stock: true, trackStock: true } },
    },
  });
  if (!item || !ownsCart(identity, item.cart)) return null;
  return item;
}

export async function updateCartItemQuantity(input: unknown): Promise<CartActionResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: cartCopy.updateError };
  const { itemId, quantity } = parsed.data;

  const item = await findOwnedItem(itemId);
  if (!item) return { ok: false, error: cartCopy.updateError };

  const nextQuantity = Math.min(quantity, cartStockCap(item.variant));
  if (nextQuantity === 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: nextQuantity } });
  }

  refresh();
  return { ok: true, capped: nextQuantity < quantity };
}

const removeSchema = z.object({ itemId: z.cuid() });

export async function removeCartItem(input: unknown): Promise<CartActionResult> {
  const parsed = removeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: cartCopy.updateError };

  const item = await findOwnedItem(parsed.data.itemId);
  if (!item) return { ok: false, error: cartCopy.updateError };

  await prisma.cartItem.delete({ where: { id: item.id } });
  refresh();
  return { ok: true, capped: false };
}
