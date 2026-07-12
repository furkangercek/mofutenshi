---
name: verify
description: Wire-verify a change against the running prod build by replicating no-JS form posts over HTTP. Use when verifying storefront/admin flows end-to-end before a commit checkpoint.
---

# Verify (this repo's evidence-capture recipe)

Surface: HTTP against the prod build. Drive pages and server actions the way
a no-JS browser would; assert on the returned HTML/redirects, then confirm
bytes in the DB.

## Build + launch

```bash
npm run build                      # DB must be up (npm run db:up; start Docker Desktop first)
rtk proxy npm run start            # run in background; wait for /robots.txt = 200 on :3000
```

## Login (Auth.js credentials, JWT session)

1. `GET /api/auth/csrf` → `{csrfToken}` + cookie.
2. `POST /api/auth/callback/credentials` urlencoded `{csrfToken, email, password}`
   → 302 + `authjs.session-token` cookie. Test users: see docs/STATUS.md
   (customer@test.local / test-password-1).

## Posting server actions without JS

- Fetch the page, find the `<form>` (skip the header search form), collect ALL
  hidden inputs (`$ACTION_REF_x`, `$ACTION_x:0`, `$ACTION_x:1`, `$ACTION_KEY`)
  with HTML entities unescaped.
- **POST as `multipart/form-data`** (node `FormData`) to the page URL —
  server-action forms degrade to multipart, urlencoded bodies parse as EMPTY
  and the action just re-renders with a validation error.
- Success with `redirect()` → 303 + `location`; validation error → 200.
- `$ACTION_REF_x` inputs render with NO `value` attribute — a parser that
  requires `value="…"` drops them and the post 500s with "Failed to find
  Server Action". Treat a missing value as `""`.
- A 200 action response body is the RSC FLIGHT payload, not HTML — assert
  errors by searching the raw stream for the Turkish copy string, not by
  parsing `role="alert"` markup.

## Gotchas

- Redirecting pages under PPR stream a 200 shell — assert on absent private
  data + `/login` marker, not on status codes.
- Setup (cart fill, DB assertions) needs project-local tsx scripts
  (`scripts/tmp-*.ts`, imports `../src/generated/prisma/client` +
  `dotenv/config`); scratchpad scripts can't resolve node_modules. Delete
  them before committing.
- Multiline inline `-e` scripts fail under rtk — write script files.
- After a schema change: `npx prisma generate` + rebuild before trusting the
  server (stale client → P2022).
