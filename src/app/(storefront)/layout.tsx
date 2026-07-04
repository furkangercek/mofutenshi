import { Suspense } from "react";
import { CartContents } from "@/components/cart/cart-contents";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartSkeleton } from "@/components/cart/cart-skeleton";
import { CartUIProvider } from "@/components/cart/cart-ui";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CartUIProvider>
      <Header />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <Footer />
      <CartDrawer>
        <Suspense fallback={<CartSkeleton />}>
          <CartContents variant="drawer" />
        </Suspense>
      </CartDrawer>
    </CartUIProvider>
  );
}
