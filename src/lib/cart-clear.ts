import { clearCartToken, readCartToken } from "@/lib/cart-cookie";
import { prisma } from "@/lib/prisma";

// After an order is placed (manual) or paid (gateway callback), the cart that
// produced it is deleted. Only callable where cookies may be written.
export async function clearCartAfterOrder(userId: string | null): Promise<void> {
  if (userId) {
    await prisma.cart.deleteMany({ where: { userId } });
    return;
  }
  const token = await readCartToken();
  if (!token) return;
  await prisma.cart.deleteMany({ where: { sessionToken: token } });
  await clearCartToken();
}
