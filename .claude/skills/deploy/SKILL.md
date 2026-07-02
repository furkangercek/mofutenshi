---
name: deploy
description: "PLACEHOLDER - deployment is not set up yet (no VPS provisioned). If invoked, explain the status and what is planned; do not attempt to deploy anything."
---

# Deploy (NOT IMPLEMENTED)

There is no deployment target yet. Do not attempt to deploy.

## Planned setup (fill in when the VPS is available)

Per `docs/ARCHITECTURE.md` and ROADMAP Phase 1 step 10:

- Dockerfile for the Next.js app (standalone output)
- Docker compose: app + PostgreSQL (volume-backed)
- Coolify on the VPS: git-push deploys, HTTPS, env management
- Cloudflare: DNS, CDN caching, WAF in front
- `prisma migrate deploy` on release
- Off-VPS Postgres backup job (DECISIONS Q13 - must be answered before launch)

## TODO when VPS is ready

- [ ] Provision VPS, install Coolify
- [ ] Write Dockerfile + compose
- [ ] Configure domains + Cloudflare
- [ ] Set up env/secrets in Coolify
- [ ] Backup job + restore test
- [ ] Rewrite this skill with the real deploy/rollback procedure
