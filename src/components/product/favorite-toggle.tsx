import Link from "next/link";
import { Heart } from "lucide-react";
import { textLinkClass } from "@/components/ui/link";
import { toggleWishlistAction } from "@/lib/actions/wishlist";
import { auth } from "@/lib/auth";
import { wishlistCopy } from "@/lib/copy/wishlist";
import { prisma } from "@/lib/prisma";

// Server component streamed into the prerendered PDP through a Suspense hole
// (passed to the client ProductView as a slot). Plain form post, no JS needed.
export async function FavoriteToggle({
  productId,
  productSlug,
}: {
  productId: string;
  productSlug: string;
}) {
  const session = await auth();
  if (!session?.user) {
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(`/p/${productSlug}`)}`}
        className={textLinkClass}
      >
        <Heart aria-hidden className="mr-2 size-4" />
        {wishlistCopy.guestHint}
      </Link>
    );
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
    select: { id: true },
  });

  return (
    <form action={toggleWishlistAction}>
      <input type="hidden" name="productId" value={productId} />
      <button type="submit" className={textLinkClass}>
        <Heart
          aria-hidden
          className={`mr-2 size-4 ${existing ? "fill-accent stroke-accent" : ""}`}
        />
        {existing ? wishlistCopy.remove : wishlistCopy.add}
      </button>
    </form>
  );
}
