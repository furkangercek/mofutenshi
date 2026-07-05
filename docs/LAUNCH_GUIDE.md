# Launch guide (owner-facing)

Plain-language guide to the six things only you can do before launch, in
order. Each section explains what the thing IS, the recommended way, and
alternatives. The technical wiring that happens after each step is in
`docs/DEPLOY.md` — this file is about accounts, purchases, and decisions.

Prices are approximate (2026) and UIs change; treat the steps as a map, not
pixel-perfect instructions.

## Cost summary

| Item         | Recommended               | Rough cost                        |
| ------------ | ------------------------- | --------------------------------- |
| Domain       | Cloudflare Registrar      | ~$10-12/year (.com, at cost)      |
| VPS          | Hetzner CX22              | ~€4-5/month                       |
| Coolify      | self-hosted, open source  | free                              |
| R2 storage   | Cloudflare R2             | free tier (10GB) covers v1 easily |
| iyzico       | sandbox free              | production: commission per sale   |
| Google OAuth | Google Cloud              | free                              |
| Legal texts  | lawyer or vetted template | one-time; varies                  |

Total fixed cost: roughly €5-6/month + ~$11/year.

---

## 1. Domain: buy `mofutenshi.com`

**What it is:** the address of your site. You rent it yearly from a
"registrar". You already decided on `mofutenshi.com` (R8) — this purchase is
the reconfirmation. Once bought, buying also `mofutenshi.com.tr` later is
optional brand protection, not required.

**Recommended: Cloudflare Registrar.** You will use Cloudflare for
DNS/CDN/security anyway (it's in the architecture), and their registrar
sells at wholesale cost with no upsells.

1. Create a free account at `dash.cloudflare.com`.
2. In the dashboard: **Domain Registration → Register Domains**, search
   `mofutenshi.com`, buy it (card or PayPal).
3. Done — the domain automatically uses Cloudflare DNS, which is exactly
   what the deploy runbook expects. No transfer step needed.

**Alternatives:**

- **Porkbun / Namecheap** — fine prices, easy UIs. You'd then point the
  domain's nameservers at Cloudflare (free plan) afterwards, a 5-minute
  extra step.
- **Turkish registrars (isimtescil, natro, güzel.net.tr)** — needed only if
  you want `.com.tr` (requires them or METU nic.tr process). For `.com`
  they offer no advantage.
- Avoid GoDaddy — aggressive renewal pricing.

---

## 2. VPS + Coolify

**What a VPS is:** a small rented Linux server that runs 24/7 — your shop's
computer. The app, the database, and the deploy tooling all live on it.

**What Coolify is:** a free, open-source control panel you install on the
VPS once. It gives you a web dashboard where "deploy" means: it pulls your
GitHub repo, builds the Docker image, and swaps the running container —
plus it manages HTTPS certificates, environment variables (secrets), the
Postgres database container, and scheduled tasks (our nightly backup). It
is essentially a self-hosted Heroku/Vercel. Without it you'd be typing
docker commands over SSH by hand on every release.

**Recommended: Hetzner.** German provider, excellent price/performance,
EU data centers (fine latency to Turkey).

1. Create an account at `hetzner.com` (Cloud console). New accounts may be
   asked for ID verification — normal.
2. Create a project → **Add Server**:
   - Location: Falkenstein or Helsinki (either is fine)
   - Image: **Ubuntu 24.04**
   - Type: shared vCPU x86, **CX22** (2 vCPU / 4GB RAM / 40GB disk) —
     comfortable for app + Postgres + builds. 2GB would be tight because
     the Docker build itself is memory-hungry.
   - Add your **SSH key** (on Windows: `ssh-keygen` in a terminal, then
     paste the contents of `~/.ssh/id_ed25519.pub`). Do not use
     password-only access.
3. SSH in (`ssh root@<server-ip>`) and install Coolify with their
   one-liner from `coolify.io/docs` (a `curl ... | bash` command).
4. Open `http://<server-ip>:8000`, create the admin account immediately
   (first visitor becomes admin — do this right after install).
5. Stop here and tell the agent / follow `docs/DEPLOY.md` — the app,
   database, domain, and backup task are configured inside Coolify from
   this point.

**Alternatives:**

- **VPS providers:** DigitalOcean (~$12/mo for the same specs, nicer docs),
  Vultr, OVH. Contabo is cheaper but oversold/slow support — not worth it
  for a shop handling payments.
- **Instead of Coolify:** Dokploy or CapRover (same idea, smaller
  communities); plain `docker compose` over SSH (no dashboard, more manual
  work per release); or skip the VPS entirely with **Vercel + a managed
  Postgres (e.g. Neon)** — least ops work, but costs grow with traffic and
  it abandons the "own your infrastructure, fixed cost" posture in the PRD.
  The codebase would run there with minor config changes if you ever want
  to switch.

---

## 3. Cloudflare R2 (image storage + backups)

**What it is:** object storage — a place to put files (product photos,
database backups) that isn't the VPS disk. "S3-compatible" means it speaks
the same API as Amazon S3, which our code uses. Two reasons it's separate
from the VPS: images survive even if the server dies, and Cloudflare
serves them fast from CDN. Free tier: 10GB storage, no egress fees — a
sticker shop will not exceed this for a long time.

Steps (in the same Cloudflare account as the domain):

1. Dashboard → **R2 Object Storage** → enable it (asks for a card, but
   free tier applies first).
2. **Create bucket** named `mofutenshi-images`. Location: automatic.
3. Make it publicly readable via a custom domain: bucket → **Settings →
   Public access → Custom Domains** → add `img.mofutenshi.com` (Cloudflare
   wires the DNS automatically since the domain is already there).
4. Create credentials: R2 overview → **Manage R2 API Tokens → Create API
   Token** → permission **Object Read & Write**, scoped to just this
   bucket. Save the Access Key ID and Secret Access Key somewhere safe —
   the secret is shown once.
5. You now have all five values the app needs (they go into Coolify later,
   see the env table in `docs/DEPLOY.md`):
   - `R2_ACCOUNT_ID` — on the R2 overview page
   - `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` — from step 4
   - `R2_BUCKET=mofutenshi-images`
   - `R2_PUBLIC_URL=https://img.mofutenshi.com`
6. Nightly database backups reuse the same bucket under `backups/` —
   nothing extra to buy.

**Alternatives:** Backblaze B2 (also cheap, also S3-compatible), AWS S3
(the original; more expensive egress), Bunny Storage. The code only
assumes an S3-compatible endpoint, so switching later is an env-var
change. R2 wins here because you're already on Cloudflare and egress is
free.

---

## 4. iyzico (card payments)

**What it is:** the payment gateway (R7 decision) — the licensed company
that actually processes credit cards so card data never touches our
server. Customers see their hosted payment form at checkout.

**Important reality check:** a **production** iyzico merchant account
requires a registered Turkish business (şahıs şirketi is enough) with a
business bank account and tax number. If you don't have one yet, talk to a
mali müşavir (accountant) — şahıs şirketi setup is quick and cheap in
Turkey. The **sandbox** (test) account needs none of that and is the
immediate next step.

**Sandbox now (unblocks verification):**

1. Register at the iyzico developer/sandbox portal:
   `sandbox-merchant.iyzipay.com` (free, instant).
2. In the sandbox dashboard find **Settings → API Keys**: copy the sandbox
   **API Key** and **Secret Key**.
3. Give them to the agent / put them in `.env` locally:
   `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, and
   `IYZICO_BASE_URL=https://sandbox-api.iyzipay.com`.
4. The card flow gets verified end-to-end with iyzico's test card numbers
   (they publish them in the sandbox docs). **This is the one unverified
   piece of checkout — do this before everything else if you do only one
   thing this week.**

**Production later (needs the business):**

1. Apply at `iyzico.com` as a merchant — company info, bank account (IBAN),
   ID. Approval typically takes a few days.
2. Swap the three env vars in Coolify for the production values
   (`IYZICO_BASE_URL=https://api.iyzipay.com`).
3. Costs: no monthly fee on the standard plan; commission per successful
   sale (single-digit percent + small fixed fee; exact rate shown in your
   merchant agreement).

**Alternatives:** PayTR (slightly cheaper commissions, clunkier API — this
was the R7 trade-off and is easy to revisit later because payment sits
behind a provider-agnostic interface), param.com.tr, or Stripe (does not
support TRY merchants in Turkey — not an option). Stick with iyzico.

---

## 5. Google OAuth (the "Sign in with Google" button)

**What it is:** free credentials that let customers log in with their
Google account instead of a password. The button is hidden until these
exist, so this is optional for launch day — email/password login works
without it.

1. Go to `console.cloud.google.com`, create a project (name: MofuTenshi).
2. **APIs & Services → OAuth consent screen**: External, app name
   MofuTenshi, your support email. Publish the app (stays in "production"
   mode; no verification needed for basic sign-in scopes).
3. **APIs & Services → Credentials → Create Credentials → OAuth client
   ID** → type **Web application**:
   - Authorized JavaScript origin: `https://mofutenshi.com`
   - Authorized redirect URI:
     `https://mofutenshi.com/api/auth/callback/google`
4. Copy the **Client ID** and **Client Secret** → they become
   `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` in Coolify.
5. For local testing, add `http://localhost:3000` and
   `http://localhost:3000/api/auth/callback/google` as a second
   origin/redirect on the same client.

**Alternatives:** none needed — Google is the highest-coverage single
provider in Turkey. Apple/Facebook login can be added later through the
same Auth.js setup if customers ask.

---

## 6. Legal texts (replace the placeholders)

**What it is:** the pages at `/legal/terms`, `/legal/privacy`,
`/legal/shipping-returns` and the contact email currently contain
**placeholder text I wrote** — plausible-sounding but NOT legally
reviewed, and the email `destek@mofutenshi.com` is invented.

Turkish e-commerce law requires, at minimum:

- **Mesafeli Satış Sözleşmesi** (distance sales contract)
- **Ön Bilgilendirme Formu** (pre-purchase information)
- **KVKK Aydınlatma Metni** (personal-data notice) + çerez (cookie) notice
- Clear cayma hakkı (14-day withdrawal) and shipping/refund terms

**Update (2026-07-05):** full drafts now exist in the codebase — Mesafeli
Satış Sözleşmesi and Ön Bilgilendirme Formu (`src/lib/copy/legal.ts`, live
at `/legal/mesafeli-satis-sozlesmesi` and `/legal/on-bilgilendirme`) and a
KVKK Aydınlatma Metni (`src/lib/copy/static-pages.ts`, at
`/legal/privacy`), drafted against the current mevzuat including the
2026-effective rule that return shipping is the seller's cost. Checkout
requires the customer to confirm both documents before ordering.

What remains for you:

1. Fill the `[BRACKETED]` fields in those files once the şahıs şirketi
   exists: unvan, adres, vergi dairesi/no, MERSİS (varsa), telefon, and the
   anlaşmalı kargo firması.
2. **Have a lawyer review the drafts** — they are careful drafts, not
   legal advice; a routine one-time review for an e-commerce lawyer.
3. Set up the real support email. Simplest: **Cloudflare Email Routing**
   (free, in the same dashboard) forwards `destek@mofutenshi.com` to your
   personal inbox — 5 minutes, no mail server. (Sending FROM that address
   comes with Phase 2 transactional email.)

Also on the legal/financial radar (not blocking launch, but ask the mali
müşavir): e-Arşiv invoice obligations for online sales — invoicing is
planned as Phase 2 in the roadmap, but the legal obligation to issue
invoices exists from the first sale regardless of what the software
automates.

---

## Suggested order, restated

1. **iyzico sandbox keys** — 10 minutes, free, unblocks the last unverified
   code path while everything else is in progress.
2. **Domain** on Cloudflare (~15 min) — unblocks R2 custom domain, email
   routing, and Google OAuth URLs.
3. **R2 bucket + token** (~15 min) — then a real image upload gets verified.
4. **VPS + Coolify** (~1 hour) — then we deploy per `docs/DEPLOY.md`.
5. **Google OAuth** (~20 min) — optional for launch, nice to have.
6. **Legal texts + şahıs şirketi + iyzico production** — the long pole;
   start the business/lawyer conversations early, they run in parallel
   with everything above.
