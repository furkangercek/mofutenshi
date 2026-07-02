"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { NavigationMenu } from "radix-ui";
import { navCopy } from "@/lib/copy/common";
import type { NavTag } from "@/lib/queries/tags";

const itemLinkClass =
  "inline-flex h-11 items-center gap-1 px-3 text-sm font-medium text-ink transition-colors hover:text-muted";

export function MainNav({ tags }: { tags: NavTag[] }) {
  return (
    <NavigationMenu.Root aria-label={navCopy.mainNavLabel} className="relative hidden lg:block">
      <NavigationMenu.List className="flex items-center">
        {tags.map((tag) => (
          <NavigationMenu.Item key={tag.id} className="relative">
            {tag.children.length > 0 ? (
              <>
                <NavigationMenu.Trigger asChild>
                  <Link href={`/t/${tag.slug}`} className={itemLinkClass}>
                    {tag.name}
                    <ChevronDown aria-hidden className="size-3.5" />
                  </Link>
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="border-border bg-surface absolute top-full left-0 z-50 min-w-44 rounded-md border p-2 shadow-lg">
                  <ul className="flex flex-col">
                    <li>
                      <NavigationMenu.Link asChild>
                        <Link
                          href={`/t/${tag.slug}`}
                          className="hover:bg-background block rounded px-3 py-2 text-sm font-medium"
                        >
                          {navCopy.viewAll}
                        </Link>
                      </NavigationMenu.Link>
                    </li>
                    {tag.children.map((child) => (
                      <li key={child.id}>
                        <NavigationMenu.Link asChild>
                          <Link
                            href={`/t/${child.slug}`}
                            className="text-muted hover:bg-background hover:text-ink block rounded px-3 py-2 text-sm"
                          >
                            {child.name}
                          </Link>
                        </NavigationMenu.Link>
                      </li>
                    ))}
                  </ul>
                </NavigationMenu.Content>
              </>
            ) : (
              <NavigationMenu.Link asChild>
                <Link href={`/t/${tag.slug}`} className={itemLinkClass}>
                  {tag.name}
                </Link>
              </NavigationMenu.Link>
            )}
          </NavigationMenu.Item>
        ))}
        <NavigationMenu.Item>
          <NavigationMenu.Link asChild>
            <Link href="/sales" className={itemLinkClass}>
              {navCopy.sales}
            </Link>
          </NavigationMenu.Link>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link asChild>
            <Link href="/products" className={itemLinkClass}>
              {navCopy.allProducts}
            </Link>
          </NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}
