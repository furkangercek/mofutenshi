// Per-line quantity ceiling, shared by cart actions and the login cart merge.
export const MAX_CART_QUANTITY = 99;

// R26: made-to-order variants (trackStock off) have no stock count — the only
// per-line ceiling is MAX_CART_QUANTITY. Used everywhere a cart quantity is
// capped and as the view-model "stock" so out-of-stock UI never fires for them.
export function cartStockCap(variant: { stock: number; trackStock: boolean }): number {
  return variant.trackStock ? Math.max(variant.stock, 0) : MAX_CART_QUANTITY;
}
