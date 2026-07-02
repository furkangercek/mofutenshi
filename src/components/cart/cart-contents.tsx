import { CartPanel, type CartPanelVariant } from "@/components/cart/cart-panel";
import { getCartView } from "@/lib/queries/cart";
import { getShippingSettings } from "@/lib/queries/settings";

export async function CartContents({ variant }: { variant: CartPanelVariant }) {
  const [cart, shipping] = await Promise.all([getCartView(), getShippingSettings()]);

  return (
    <CartPanel
      cart={cart}
      freeShippingThresholdCents={shipping?.freeShippingThresholdCents ?? null}
      variant={variant}
    />
  );
}
