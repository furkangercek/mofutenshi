---
name: frontend
description: Next.js 16 + Tailwind v4 + React 19 conventions for this project, including Turkish-locale rules. Use when building or modifying any storefront/admin page, component, layout, or route handler - alongside /ui-review for the design checklist.
---

# Frontend conventions

## Next.js 16 (verify, do not assume)

Training data is stale for this stack. Before using any App Router API (caching, metadata, params, route handlers, server actions), check the shipped docs: `node_modules/next/dist/docs/`. Known v16 differences worth double-checking: async `params`/`searchParams`, caching defaults, and route-type generation.

- Server components by default; `"use client"` only for real interactivity, pushed to leaf components.
- Data reads through thin query modules over the Prisma singleton (`src/lib/prisma.ts`); cache with tags and revalidate on admin writes.
- Mutations: server actions with zod validation and server-side auth checks (CLAUDE.md hard rules).
- `next/image` with explicit dimensions; `next/font` self-hosted only.

## Tailwind v4

- v4 is CSS-first: design tokens live in `@theme` in `globals.css` as CSS variables - there is no `tailwind.config.js` by default. Map the DESIGN.md semantic tokens there once, then use utilities that reference them.
- Components use ONLY semantic tokens (`bg-surface`, `text-muted`, ...) - never raw hex, never the raw pastel variables directly.
- Class order is handled by prettier-plugin-tailwindcss - do not hand-sort.

## Turkish locale (v1 is Turkish-only)

- `<html lang="tr">`; all UI copy Turkish; SEO metadata Turkish.
- UI strings live in centralized copy modules (e.g., `src/lib/copy/<feature>.ts`), never hardcoded in JSX. This makes Phase 3 i18n a mapping job.
- **Casing trap:** Turkish dotted/dotless i. `"istanbul".toUpperCase()` gives `ISTANBUL` (wrong - should be İSTANBUL). Use `toLocaleUpperCase("tr-TR")` / `toLocaleLowerCase("tr-TR")` for any user-visible case transforms; prefer CSS `text-transform` only for ASCII-safe strings.
- **Money:** format kuruş integers with `Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" })` (divide by 100 at the view layer only). Never hand-build price strings.
- Dates: `Intl.DateTimeFormat("tr-TR")`.
- Slugs stay ASCII (transliterate Turkish chars: ş→s, ğ→g, ı→i, ö→o, ü→u, ç→c).

## Components

- Radix UI / shadcn primitives for overlays, menus, selects (see DESIGN.md component list); style them custom against semantic tokens without breaking focus/ARIA behavior.
- Every page needs branded loading, empty, and error states - not raw defaults.
