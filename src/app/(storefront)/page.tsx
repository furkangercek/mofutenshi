import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductRow } from "@/components/product/product-row";
import { ButtonLink } from "@/components/ui/button";
import { toCardView } from "@/lib/card-view";
import { homeSectionCopy } from "@/lib/copy/catalog";
import { homeCopy, siteCopy } from "@/lib/copy/common";
import { getCatalog } from "@/lib/queries/catalog";
import { getNavTags } from "@/lib/queries/tags";

// Pastel gradient stand-ins for tile photography — swap for next/image
// backgrounds when real photos exist (docs/DESIGN.md, placeholder imagery).
const tileBackgrounds = [
  "bg-linear-to-br from-primary/70 via-ghost to-accent/50",
  "bg-linear-to-br from-accent/60 via-ghost to-primary/40",
  "bg-linear-to-br from-lavender/50 via-ghost to-primary/50",
  "bg-linear-to-br from-primary/40 via-ghost to-lavender/60",
];

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const SECTION_SIZE = 4;

export default async function Home() {
  const [tags, catalog] = await Promise.all([getNavTags(), getCatalog()]);

  // All sections are data-driven (PRD US-01): sale schedule, createdAt,
  // best-seller tag, isFeatured flag.
  const onSale = catalog.filter((p) => p.onSale).slice(0, SECTION_SIZE);
  const newArrivals = [...catalog]
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
    .slice(0, SECTION_SIZE);
  const bestSellers = catalog
    .filter((p) => p.tagSlugs.includes("best-seller"))
    .slice(0, SECTION_SIZE);
  const featured = catalog.filter((p) => p.isFeatured).slice(0, SECTION_SIZE);

  return (
    <div className="flex flex-col gap-16 pb-24">
      <section className="relative isolate overflow-hidden px-4 pt-20 pb-16 text-center sm:pt-28 sm:pb-20">
        <div
          aria-hidden
          className="bg-primary/40 absolute -top-24 left-1/2 -z-10 size-96 -translate-x-[80%] rounded-full blur-3xl"
        />
        <div
          aria-hidden
          className="bg-accent/30 absolute top-8 left-1/2 -z-10 size-80 translate-x-[10%] rounded-full blur-3xl"
        />
        <div
          aria-hidden
          className="bg-lavender/30 absolute -bottom-32 left-1/2 -z-10 size-96 -translate-x-1/4 rounded-full blur-3xl"
        />
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
          <h1 className="animate-rise font-display text-4xl leading-tight sm:text-6xl">
            {siteCopy.tagline}
          </h1>
          <p className="animate-fade-up text-muted max-w-xl text-lg [animation-delay:120ms]">
            {siteCopy.description}
          </p>
          <div className="animate-fade-up mt-2 [animation-delay:240ms]">
            <ButtonLink href="/products" size="lg">
              {homeCopy.heroCta}
            </ButtonLink>
          </div>
        </div>
      </section>

      <ProductRow title={homeSectionCopy.onSale} href="/sales" products={onSale.map(toCardView)} />
      <ProductRow
        title={homeSectionCopy.newArrivals}
        href="/products?sort=newest"
        products={newArrivals.map(toCardView)}
      />
      <ProductRow
        title={homeSectionCopy.bestSellers}
        href="/t/best-seller"
        products={bestSellers.map(toCardView)}
      />
      <ProductRow
        title={homeSectionCopy.featured}
        href="/products"
        products={featured.map(toCardView)}
      />

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-2xl sm:text-3xl">{homeCopy.collectionsHeading}</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {tags.map((tag, index) => (
            <Link
              key={tag.id}
              href={`/t/${tag.slug}`}
              className="group border-border relative flex aspect-4/5 items-end overflow-hidden rounded-xl border p-4 transition-shadow duration-300 hover:shadow-lg"
            >
              <div
                aria-hidden
                className={`absolute inset-0 transition-transform duration-300 ease-out group-hover:scale-105 ${tileBackgrounds[index % tileBackgrounds.length]}`}
              />
              <span className="relative flex items-center gap-2 font-medium">
                {tag.name}
                <ArrowRight
                  aria-hidden
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
