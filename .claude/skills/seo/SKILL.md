---
name: seo
description: SEO checklist for public storefront routes. Use whenever creating or modifying any public page (homepage, /t/[tag], /sales, /p/[product], /products, search, static pages) - run through the checklist before committing.
---

# SEO checklist (public storefront routes)

SSR/SEO is a core goal (PRD G5). Every public route must pass this list. Verify current metadata APIs in `node_modules/next/dist/docs/` first.

## Per page

- [ ] `generateMetadata`: unique Turkish `title` (brand-suffixed) and `description`; OpenGraph + Twitter card with a real image (product primary image on PDPs)
- [ ] Canonical URL set; filter/sort query params must NOT create duplicate indexable URLs (canonicalize to the clean path)
- [ ] Page renders its SEO-critical content server-side - no client-only product data
- [ ] Semantic HTML: one `h1`, landmark structure, real links (`<a href>`) for navigation - crawlers do not click buttons

## Product pages (PDP)

- [ ] JSON-LD structured data: `Product` + `Offer` with `priceCurrency: "TRY"`, price from the EFFECTIVE (sale-aware) price, availability from stock
- [ ] Sale pricing visible in HTML (strikethrough original + current)

## Listing pages (PLP, tags, /sales)

- [ ] Infinite scroll has a crawlable fallback: every product URL must be reachable without JS - `sitemap.xml` listing all product/tag URLs is the chosen offset (PRD §9.6); keep it complete and auto-generated
- [ ] Empty states still return 200 with meaningful copy (not errors)

## Site-wide (check once, keep true)

- [ ] `<html lang="tr">`
- [ ] `sitemap.xml` (all products + tags + static pages) and `robots.txt` generated via App Router conventions
- [ ] 404/500 pages branded and correct status codes
- [ ] Later (Phase 3 i18n): hreflang pairs - do not add now, but do not make URL decisions that preclude a `/en` prefix

## Performance floor (SEO-adjacent)

- [ ] LCP element is a priority-loaded `next/image`; no layout shift from images/fonts (explicit dims, `font-display` handled by next/font)
- [ ] Lighthouse >= 90 on changed pages (run when the page is functional)
