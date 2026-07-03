import Link from "next/link";
import Form from "next/form";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { AccountIndicator, AccountLink } from "@/components/account/account-indicator";
import { CartIndicator } from "@/components/cart/cart-indicator";
import { CartTriggerButton } from "@/components/cart/cart-trigger";
import { MainNav } from "@/components/layout/main-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { authCopy } from "@/lib/copy/auth";
import { searchCopy } from "@/lib/copy/catalog";
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
        <Form action="/search" className="hidden items-center md:flex">
          <input
            type="search"
            name="q"
            placeholder={searchCopy.placeholder}
            aria-label={searchCopy.placeholder}
            className="border-border bg-surface focus:outline-ring h-9 w-40 rounded-md border px-3 text-sm transition-[width] duration-300 focus:w-56 focus:outline-2"
          />
        </Form>
        <Link
          href="/search"
          aria-label={searchCopy.submit}
          className="text-ink hover:bg-background inline-flex size-11 items-center justify-center rounded-md md:hidden"
        >
          <Search aria-hidden className="size-5" />
        </Link>
        <Suspense fallback={<AccountLink href="/login" label={authCopy.loginTitle} />}>
          <AccountIndicator />
        </Suspense>
        <Suspense fallback={<CartTriggerButton count={0} />}>
          <CartIndicator />
        </Suspense>
      </div>
    </header>
  );
}
