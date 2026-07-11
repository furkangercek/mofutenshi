# Deploy runbook (v1: single VPS, Coolify, Cloudflare)

Status: **prepared, not yet provisioned.** The Docker image, backup job, and
restore procedure are verified locally (2026-07-05). Everything below that
touches a real VPS/DNS is a checklist for provisioning day.

Topology: see `docs/ARCHITECTURE.md`. One app container (this repo's
`Dockerfile`) + one Postgres 17 container with a volume, both managed by
Coolify; Cloudflare in front (DNS, CDN, WAF); R2 for images and backups.

Owner-facing companion (what to buy where, alternatives, costs, legal
prerequisites): `docs/LAUNCH_GUIDE.md`. This file assumes those accounts
and credentials already exist.

## The build needs a migrated, reachable database

`next build` prerenders pages that query Postgres (Cache Components +
`generateStaticParams`). The Dockerfile's build stage therefore runs
`prisma migrate deploy && next build` with `DATABASE_URL` passed as a
build-time variable. Consequences:

- Coolify must build **on the VPS** (default) so the DB container is
  reachable at build time. Set `DATABASE_URL` as a **build variable** AND a
  runtime variable.
- Migrations apply during image build — before the new app starts. Old app
  code keeps running against the new schema for the build duration; keep
  migrations backward-compatible (additive first, destructive later).
- A failed migration fails the build and leaves the running deployment
  untouched.

## Coolify setup (provisioning day)

1. **VPS**: any Docker-capable host, 2GB+ RAM. Install Coolify (their
   one-line installer). Lock SSH to key auth.
2. **Postgres resource**: Coolify → New Resource → PostgreSQL 17.
   Volume-backed. Note the internal connection URL; the DB must NOT be
   exposed publicly.
3. **App**: New Resource → Public/Private Git → this repo, build pack
   **Dockerfile**. Port 3000.
4. **Environment variables** (mark `DATABASE_URL` also as build variable):

   | Var                                                               | Notes                                                      |
   | ----------------------------------------------------------------- | ---------------------------------------------------------- |
   | `DATABASE_URL`                                                    | internal Coolify Postgres URL                              |
   | `AUTH_SECRET`                                                     | fresh 32-byte secret, never reuse dev                      |
   | `SITE_URL`                                                        | `https://mofutenshi.com` (R8)                              |
   | `R2_ACCOUNT_ID/ACCESS_KEY_ID/SECRET_ACCESS_KEY/BUCKET/PUBLIC_URL` | image storage (R2 bucket with public custom domain)        |
   | `IYZICO_API_KEY/SECRET_KEY/BASE_URL`                              | production keys + `https://api.iyzipay.com`                |
   | `AUTH_GOOGLE_ID/SECRET`                                           | callback `https://mofutenshi.com/api/auth/callback/google` |

   **Never set `LOCAL_UPLOAD_DIR` in production** (R28 local-dev fallback):
   uploads would land on the ephemeral container disk and vanish on redeploy.

5. **Domain**: assign `mofutenshi.com` to the app in Coolify (it provisions
   the origin cert / proxy).
6. Deploy. First-deploy smoke: `/`, `/products`, a PDP, `/sitemap.xml`,
   `/robots.txt`, `/admin` (should 404 for anonymous after redirect to login).
7. **First admin**: register via `/register`, then from the app container:
   `node`-less promote is not available in the standalone image — run the
   promote from a repo checkout (`npm run admin:promote -- <email>`) against
   the prod `DATABASE_URL`, or flip `role` to `ADMIN` in the DB directly.
   Re-login afterwards (role lives in the JWT).

## Cloudflare (after domain purchase — reconfirm R8 first)

- DNS: `A`/`CNAME` for apex + `www` → VPS, **proxied** (orange cloud).
- SSL/TLS mode **Full (strict)**.
- Speed → no Rocket Loader (breaks hydration); Auto Minify off (Next already
  minifies).
- Cache: static assets are fingerprinted (`/_next/static/*`, immutable) and
  cache themselves; do NOT page-cache HTML (auth/cart vary per user).
- WAF: default managed rules; rate-limit `/api/*` and `/login` modestly.
- iyzico callback `POST /api/payments/iyzico/callback` must not be
  challenged — add a WAF skip rule for that exact path if challenges appear.

## Backups (nightly `pg_dump` → R2)

Uploader: `scripts/backup-db.mjs`, baked into the app image; uses the app's
R2 env vars, keeps the newest `BACKUP_KEEP` (default 14) dumps under
`backups/` in the bucket.

Coolify **Scheduled Task** (or host cron), nightly ~04:00 Istanbul:

```sh
docker exec <db-container> pg_dump -U mofutenshi -Fc mofutenshi \
  | docker exec -i <app-container> node scripts/backup-db.mjs
```

Verify after the first run: object appears in R2 `backups/`, size plausible
(local DB dumps at ~44 KB with seed data; production grows).

## Restore procedure (verified locally 2026-07-05)

```sh
# 1. Fetch the dump from R2 (dashboard or aws cli with the R2 endpoint).
# 2. Restore into a scratch DB first — never straight over production:
docker exec <db> psql -U mofutenshi -d postgres -c "CREATE DATABASE restore_test;"
docker exec -i <db> pg_restore -U mofutenshi -d restore_test --no-owner < backup.dump
# 3. Sanity-check row counts and the order-number sequence:
docker exec <db> psql -U mofutenshi -d restore_test -c \
  'SELECT (SELECT count(*) FROM "Product"), (SELECT count(*) FROM "Order"), (SELECT last_value FROM order_number_seq);'
# 4. Only then swap: stop app, rename DBs (or point DATABASE_URL), start app.
docker exec <db> psql -U mofutenshi -d postgres -c "DROP DATABASE restore_test;"
```

The custom format (`-Fc`) preserves sequences (verified: `order_number_seq`
survives the roundtrip) and is already compressed.

## Rollback

Coolify keeps previous images — redeploy the prior image tag. Schema
rollbacks are NOT automatic: migrations are forward-only, which is why they
must stay backward-compatible for at least one release.

## Local image verification (repeatable)

```sh
# DB up + migrated first (npm run db:up; npx prisma migrate deploy)
docker build --build-arg DATABASE_URL="postgresql://mofutenshi:mofutenshi@host.docker.internal:15432/mofutenshi" -t mofutenshi:local .
docker run --rm -p 3100:3000 \
  -e DATABASE_URL="postgresql://mofutenshi:mofutenshi@host.docker.internal:15432/mofutenshi" \
  -e AUTH_SECRET="local-test-secret-32-bytes-minimum!" \
  mofutenshi:local
# smoke: curl localhost:3100/ /products /sitemap.xml /robots.txt
```
