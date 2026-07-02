# Architecture

Working technical reference. The PRD (§10) is the requirements-level view; this file tracks how the system is actually built and evolves with the code.

## Runtime topology (v1)

```
Client ──HTTPS──> Cloudflare (CDN cache, WAF, DDoS, DNS)
                      │
                      ▼
                  VPS (Docker, managed by Coolify)
                   ├── next-app     Next.js server (storefront + admin + API)
                   └── postgres     PostgreSQL 16, volume-backed
                      │
                      ▼
                  Cloudflare R2 (product images, public read)
```

One codebase, one deployable app container. Admin lives under `/admin` in the same Next.js app, gated by role.

## Application layers

| Layer            | Where                                        | Notes                                                                 |
| ---------------- | -------------------------------------------- | --------------------------------------------------------------------- |
| Storefront pages | `app/(store)/…`                              | Server components, SSR/ISR, SEO metadata per page                     |
| Admin pages      | `app/admin/…`                                | Server components + client forms, role-gated in layout AND per action |
| Mutations        | Server actions (preferred) or route handlers | zod-validated input, auth-checked                                     |
| Data access      | Prisma client, thin query modules            | No raw SQL unless measured need                                       |
| Auth             | Auth.js with Prisma adapter                  | Session cookie: httpOnly, secure, sameSite                            |
| Images           | Upload → validate → sharp derivatives → R2   | Store object keys in DB, never full URLs                              |

## Caching strategy

- Product/category reads: cache with tag-based revalidation (`revalidateTag`) — bust tags on admin writes.
- Homepage sections (sales, new arrivals, featured): same tag mechanism.
- Cloudflare caches static assets and images; HTML stays origin-rendered (auth/cart vary).
- Cart and account pages: dynamic, never cached.

## Environments

| Env  | Where                                   | DB                 | Images                            |
| ---- | --------------------------------------- | ------------------ | --------------------------------- |
| dev  | local, `docker compose up` for Postgres | local container    | local disk or dev R2 bucket (TBD) |
| prod | VPS via Coolify git-push deploy         | container + volume | R2                                |

Prisma migrations run on deploy (`prisma migrate deploy`).

## Known trade-offs (accepted for v1)

- Single VPS, single region: app and DB share fate. Acceptable at this scale; revisit with revenue.
- Postgres in Docker means backups are our responsibility — needs an off-box backup job before launch (see DECISIONS.md Q13).
- No external search service; Postgres ILIKE/full-text is v1 search.

## Cost posture

Free tiers: Cloudflare CDN/WAF, R2 (10GB), Coolify (open-source), self-hosted fonts via `next/font`.
Paid: VPS (fixed monthly), R2 past free tier, Resend past free tier (Phase 2), payment gateway transaction fees (Phase 2).
