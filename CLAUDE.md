@AGENTS.md

# MofuTenshi

Art-focused e-commerce storefront for a single brand (figures, handcrafts, art prints, stickers). A lightweight, self-hosted alternative to Shopify. Cost efficiency and design ownership are first-class priorities.

## Source of truth

- `docs/STATUS.md` — session checkpoint: where we are, next action, reminders. **READ FIRST every session; update in every commit checkpoint.**
- `docs/PRD.md` — full product requirements (v2.0, authoritative). Read before implementing any feature.
- `docs/ARCHITECTURE.md` — technical architecture and runtime topology.
- `docs/DATA_MODEL.md` — entity/schema reference (Prisma-oriented).
- `docs/DESIGN.md` — design tokens, typography, motion, imagery rules.
- `docs/DECISIONS.md` — resolved decisions + open questions. **Check here before assuming; never silently resolve an open question — ask the owner and record the answer.**
- `docs/ROADMAP.md` — what is v1 vs. later. Do not build Phase 2+ features unless asked.

## Stack

- Next.js (App Router) + TypeScript, SSR-first for storefront SEO
- PostgreSQL (Docker) + Prisma (schema is source of truth, use migrations)
- Auth.js (NextAuth) — email/password + social, Prisma adapter
- Tailwind CSS (palette as design tokens) + Radix UI / shadcn styled custom
- Cloudflare R2 for images, sharp for on-upload optimization
- Deploy: Docker on self-hosted VPS via Coolify, Cloudflare free tier in front

## Hard rules

- Money is ALWAYS integer minor units (`priceCents` = kuruş, TRY only, KDV-inclusive). Never floats. Format only at the view layer.
- Sale prices are computed at read time, never stored on the variant. See pricing resolution in `docs/PRD.md` §7. Overlap: best price wins, no stacking.
- Navigation is TAGS, not categories (PRD §3): hierarchical + flat tags, many per product. Sales/New Arrivals are derived views, never tags.
- Stock decrements ONLY on verified `PAID` (gateway callback/webhook) — never trust client-side payment success.
- Order items are immutable snapshots (name, variant label, unit price) — catalog changes must never mutate order history.
- Server-side authorization on every admin/account mutation; UI hiding is not access control.
- Validate all inputs with zod at API/server-action boundaries.
- Storefront pages must stay SSR/statically optimized — do not turn product pages into client-only rendering.
- Respect `prefers-reduced-motion`; animate transform/opacity only.
- Every product image needs alt text; use `next/image` with explicit dimensions.

## Conventions

- Commit style: conventional commits (`feat|fix|docs|style|refactor|test|chore|perf(scope): subject`), imperative, ≤50 chars subject.
- Agent may run commits directly at agreed checkpoints (owner authorized 2026-07-02). NEVER push — the owner pushes manually.
- Storefront copy is TURKISH (v1); code, comments, identifiers, commits stay English. UI strings live in centralized copy modules, never scattered hardcoded literals (eases Phase 3 i18n). `<html lang="tr">`, Turkish SEO metadata.
- Prefer server components; add `"use client"` only where interaction requires it.
- Route naming: storefront `/t/[tagSlug]`, `/p/[productSlug]`, `/sales`; admin under `/admin`.
- Keep components self-documenting; avoid comment noise.

## Skills (invoke at these moments without being asked)

Project skills live in `.claude/skills/`:

- `/feature` — when starting ANY feature work, even if the owner just says "build X".
- `/decision` — the moment the owner answers an open question or makes a new product/technical decision. Never let a decision live only in chat.
- `/code-check` — before every commit that touches `src/`.
- `/ui-review` — after building or modifying any UI, before committing it.
- `/deploy`, `/test` — placeholders only; no VPS and no test setup yet. Do not deploy or scaffold tests unprompted.

A PostToolUse hook (`.claude/hooks/format-on-edit.js`) auto-formats edited files with Prettier — do not hand-fix formatting.

## Repo workflow

- Remote: `git@github.com-personal:furkangercek/mofutenshi.git` (SSH alias `github.com-personal` routes the owner's personal key — do not change to bare `github.com` or HTTPS).
- Git identity for this repo: `furkangercek / furkangercek97@gmail.com`.
