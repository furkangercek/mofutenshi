"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { Accordion, Dialog } from "radix-ui";
import { navCopy, siteCopy } from "@/lib/copy/common";
import type { NavTag } from "@/lib/queries/tags";

function DrawerLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Dialog.Close asChild>
      <Link
        href={href}
        className="hover:bg-background block rounded px-3 py-3 text-base font-medium"
      >
        {children}
      </Link>
    </Dialog.Close>
  );
}

export function MobileNav({ tags }: { tags: NavTag[] }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="text-ink hover:bg-background inline-flex size-11 items-center justify-center rounded-md lg:hidden"
          aria-label={navCopy.openMenu}
        >
          <Menu aria-hidden className="size-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-ink/40 fixed inset-0 z-50" />
        <Dialog.Content className="bg-surface fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col overflow-y-auto p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <Dialog.Title className="font-display text-lg">{siteCopy.name}</Dialog.Title>
            <Dialog.Description className="sr-only">{navCopy.menuTitle}</Dialog.Description>
            <Dialog.Close asChild>
              <button
                type="button"
                className="text-ink hover:bg-background inline-flex size-11 items-center justify-center rounded-md"
                aria-label={navCopy.closeMenu}
              >
                <X aria-hidden className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          <nav aria-label={navCopy.mainNavLabel} className="mt-4">
            <Accordion.Root type="multiple" className="flex flex-col">
              {tags.map((tag) =>
                tag.children.length > 0 ? (
                  <Accordion.Item key={tag.id} value={tag.slug}>
                    <div className="flex items-center">
                      <div className="flex-1">
                        <DrawerLink href={`/t/${tag.slug}`}>{tag.name}</DrawerLink>
                      </div>
                      <Accordion.Header className="contents">
                        <Accordion.Trigger
                          className="group text-muted hover:bg-background inline-flex size-11 items-center justify-center rounded-md"
                          aria-label={navCopy.subtagsLabel(tag.name)}
                        >
                          <ChevronDown
                            aria-hidden
                            className="size-4 transition-transform group-data-[state=open]:rotate-180"
                          />
                        </Accordion.Trigger>
                      </Accordion.Header>
                    </div>
                    <Accordion.Content className="overflow-hidden pl-4">
                      {tag.children.map((child) => (
                        <DrawerLink key={child.id} href={`/t/${child.slug}`}>
                          {child.name}
                        </DrawerLink>
                      ))}
                    </Accordion.Content>
                  </Accordion.Item>
                ) : (
                  <DrawerLink key={tag.id} href={`/t/${tag.slug}`}>
                    {tag.name}
                  </DrawerLink>
                ),
              )}
            </Accordion.Root>
            <div className="border-border mt-2 border-t pt-2">
              <DrawerLink href="/sales">{navCopy.sales}</DrawerLink>
              <DrawerLink href="/products">{navCopy.allProducts}</DrawerLink>
            </div>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
