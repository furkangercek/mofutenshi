# syntax=docker/dockerfile:1

# Production image for the single app container (docs/DEPLOY.md).
#
# `next build` prerenders pages that query Postgres (Cache Components), so
# the BUILD needs a reachable, MIGRATED database. The build stage therefore
# runs `prisma migrate deploy` first — same order as CI. This is a deliberate
# single-host trade-off: Coolify builds on the VPS where the DB container is
# reachable. Pass DATABASE_URL as a build-time variable.

FROM node:22-alpine AS deps
WORKDIR /app
# postinstall runs `prisma generate` (no DB needed, config + schema only).
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# ARG values can surface in intermediate-layer history; acceptable on a
# private single-host builder. Use a BuildKit secret mount if that changes.
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate
RUN npx prisma migrate deploy && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
USER node
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# Backup uploader rides along; its @aws-sdk dependency is traced into the
# standalone node_modules via src/lib/r2.ts (see docs/DEPLOY.md, backups).
COPY --from=builder --chown=node:node /app/scripts/backup-db.mjs ./scripts/backup-db.mjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/robots.txt').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
