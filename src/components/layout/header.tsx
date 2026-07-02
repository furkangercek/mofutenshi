import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { MainNav } from "@/components/layout/main-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { navCopy, siteCopy } from "@/lib/copy/common";
import { getNavTags } from "@/lib/queries/tags";

export async function Header() {
  const tags = await getNavTags();

  return (
    <header className="border-border bg-surface/85 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <MobileNav tags={tags} />
        <Link href="/" aria-label={navCopy.homeLink} className="font-display text-xl tracking-wide">
          {siteCopy.name}
        </Link>
        <div className="flex-1" />
        <MainNav tags={tags} />
        <Link
          href="/cart"
          aria-label={navCopy.cart}
          className="text-ink hover:bg-background inline-flex size-11 items-center justify-center rounded-md"
        >
          <ShoppingBag aria-hidden className="size-5" />
        </Link>
      </div>
    </header>
  );
}
