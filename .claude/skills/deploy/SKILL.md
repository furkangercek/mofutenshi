---
name: deploy
description: "Deploy prep is DONE (Dockerfile, backup job, runbook — all locally verified); the VPS is NOT provisioned yet. If invoked, follow docs/DEPLOY.md; do not attempt to deploy until the owner provisions the VPS/domain."
---

# Deploy

**No deployment target exists yet** — the owner has not provisioned the VPS
or purchased the domain (reconfirm R8 before DNS). Do not attempt to deploy.

What IS ready (verified locally 2026-07-05):

- `Dockerfile` — multi-stage standalone image; the build stage runs
  `prisma migrate deploy && next build` against a reachable DB (build-time
  `DATABASE_URL`). Local verification steps are at the bottom of
  `docs/DEPLOY.md`.
- `scripts/backup-db.mjs` — nightly `pg_dump` → R2 uploader with pruning,
  baked into the image.
- `docs/DEPLOY.md` — the runbook: Coolify setup, env table, Cloudflare
  config, backup schedule, verified restore procedure, rollback notes.

## On provisioning day

Work through `docs/DEPLOY.md` top to bottom with the owner. Blockers that
must come from the owner first: VPS, domain (R8 reconfirm), R2 + iyzico
production + Google OAuth credentials, and a fresh production `AUTH_SECRET`.

After the first successful deploy: run the smoke checklist in the runbook,
verify the first backup object lands in R2, then update this skill and
`docs/STATUS.md` with the real container names and any deviations.
