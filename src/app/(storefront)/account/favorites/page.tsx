import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { textLinkClass } from "@/components/ui/link";
import { toggleWishlistAction } from "@/lib/actions/wishlist";
import { auth } from "@/lib/auth";
import { toCardView } from "@/lib/card-view";
import { wishlistCopy } from "@/lib/copy/wishlist";
import { prisma } from "@/lib/prisma";
import { getCatalog } from "@/lib/queries/catalog";

export const metadata: Metadata = {
  title: wishlistCopy.pageTitle,
  robots: { index: false },
};

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=%2Faccount%2Ffavorites");

  const [items, catalog] = await Promise.all([
    prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { productId: true },
    }),
    getCatalog(),
  ]);
  const byId = new Map(catalog.map((product) => [product.id, product]));
  // Unpublished/deleted products drop out of the catalog snapshot silently.
  const products = items.flatMap((item) => byId.get(item.productId) ?? []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">{wishlistCopy.pageTitle}</h1>
      <p className="text-muted mt-2">{wishlistCopy.pageLead}</p>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <p className="text-muted">{wishlistCopy.empty}</p>
          <ButtonLink href="/products">{wishlistCopy.browseCta}</ButtonLink>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <div key={product.id}>
              <ProductCard product={toCardView(product)} />
              <form action={toggleWishlistAction} className="mt-1">
                <input type="hidden" name="productId" value={product.id} />
                <button type="submit" className={textLinkClass}>
                  {wishlistCopy.remove}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10">
        <Link href="/account" className={textLinkClass}>
          {wishlistCopy.backToAccount}
        </Link>
      </div>
    </div>
  );
}
