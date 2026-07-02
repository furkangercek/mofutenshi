"use client";

import { createContext, useContext, useState } from "react";

type CartUI = { open: boolean; setOpen: (open: boolean) => void };

const CartUIContext = createContext<CartUI | null>(null);

export function CartUIProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <CartUIContext.Provider value={{ open, setOpen }}>{children}</CartUIContext.Provider>;
}

export function useCartUI(): CartUI {
  const context = useContext(CartUIContext);
  if (!context) throw new Error("useCartUI must be used within CartUIProvider");
  return context;
}
