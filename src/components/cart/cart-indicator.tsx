import { CartTriggerButton } from "@/components/cart/cart-trigger";
import { getCartView } from "@/lib/queries/cart";

// Reads the cart cookie, so it must live in a Suspense hole to keep PPR
// shells static. getCartView is request-deduped with the drawer's read.
export async function CartIndicator() {
  const cart = await getCartView();
  return <CartTriggerButton count={cart.itemCount} />;
}
