# Deployment Guide

A concrete, all-free-tier stack for getting this app live on the internet (one paid-optional exception noted below). Every piece here has a permanent free tier, and the backend's `Dockerfile` has been built and run-tested locally against Postgres before writing this.

## The stack

| Piece | Service | Why |
|---|---|---|
| App database | [Neon](https://neon.tech) ✅ | Serverless Postgres, generous free tier, just a connection string |
| Identity | [Keycloak](https://www.keycloak.org) on [Render](https://render.com) ✅ | Self-hosted auth — Keycloak issues and verifies tokens, but login/registration happen on this app's own pages (see below), not Keycloak's hosted ones |
| Keycloak's database | [Neon](https://neon.tech) ✅ | A second, separate Neon project — keeps Keycloak's schema fully isolated from the app's own data |
| Backend API | [Render](https://render.com) ✅ | Free Web Service, builds straight from the repo's `Dockerfile` |
| Frontend | [Cloudflare Workers (static assets)](https://pages.cloudflare.com) ✅ | Free static hosting, connects to the repo, builds on every push |
| Domain | Render/Pages give you a free subdomain automatically (`*.onrender.com`, `*.workers.dev`) — no separate registration needed to go live. A custom domain from [free-for.dev's domain list](https://free-for.dev/#/?id=domain) is an optional extra step layered on top (see bottom). |

All dashboards deploy by connecting to a **GitHub repo** — that's the one prerequisite.

## 0. Prerequisite: push this repo to GitHub

Already done for this project (`git remote -v` shows the GitHub origin) — nothing to do here unless starting fresh.

## 1. App database — Neon

1. Sign up at neon.tech, create a project (any region close to you).
2. Copy the connection string it gives you (starts `postgresql://...`). That's your production `DATABASE_URL`.
3. Nothing else to configure — migrations run automatically when the backend container starts (see the `Dockerfile`'s `CMD`).

## 2. Identity — Keycloak on Render

Auth went through two designs before landing here, both worth knowing about since the reasoning shaped what exists today:

1. **Redirect to Keycloak's hosted pages** (Authorization Code + PKCE, the textbook-correct approach) — abandoned after real reliability problems in production: `check-sso`'s cross-origin cookie read got silently blocked by browsers (logged users out on every refresh), and a cold Keycloak instance could hang the whole login flow with zero visible error. A custom Keycloak theme was built to brand those pages (still present — `keycloak/themes/kyma`, still used for any future Keycloak-hosted flow like password reset), but the hosted-redirect approach itself was dropped.
2. **What's actually in place now**: the browser logs in by calling Keycloak's token endpoint **directly** with a Resource Owner Password Credentials grant (`kyma-web`, a public client with **Direct Access Grants** enabled) — no redirect, no iframe, no SDK (`keycloak-js` was removed entirely; see `frontend/src/lib/authTokens.ts` for the full, small, plain-fetch implementation). Registration has no equivalent self-service grant, so it goes through this app's own backend, which calls Keycloak's Admin API using a scoped **service-account client** (`kyma-backend`, `manage-users` role only — not the realm admin login).

**Trade-off made explicitly**: this drops "Sign in with Google" entirely for now (there's no password to grant for a federated identity under this grant type) and means the backend briefly sees registration passwords in transit to create the account — both accepted knowingly in exchange for a login experience that's fully in this app's own UI and doesn't depend on Keycloak's hosted pages or iframe-based session tricks at all. The Google identity provider is still configured in the realm (harmless, unused) if this gets revisited later.

### 2a. A second, separate Neon database

Create a **second** Neon project (e.g. `kyma-keycloak`) the same way as step 1 — fully isolated from the app's own database. Keycloak creates its own schema in it automatically on first boot; no manual setup needed. Copy its connection string.

### 2b. The Keycloak service on Render

This deploys from `keycloak/Dockerfile` in this repo — **not** the stock `quay.io/keycloak/keycloak` image directly. A few hard-won reasons why a custom image is necessary, discovered getting this running on Render's free tier:

- **Boot time**: the stock image re-runs Keycloak's Quarkus "build" step (~170s) on every single container start. On Render's free tier (0.1 CPU) that's long enough that Render's own port-scan gives up and kills the container before Keycloak ever finishes starting. `keycloak/Dockerfile` bakes that build step in at image-build time (`kc.sh build`), so runtime boot is `start --optimized` — cut to ~15-20s.
- **Clustering**: Keycloak defaults to distributed caching (Infinispan/JGroups) meant for multi-node clusters, which tries UDP multicast discovery — unsupported in most cloud container networks, including Render's, and burns CPU/time in a retry loop that stalls startup. The Dockerfile's `CMD` passes `--cache=local` to skip this entirely, which is correct for this single-instance deployment.
- **Memory**: left to its own container-aware defaults, the JVM sized its heap up to within a hair of Render's 512MB free-tier ceiling *at idle*, before any real traffic — a real OOM risk. The Dockerfile sets `JAVA_OPTS_APPEND="-Xms64m -Xmx200m"` explicitly, verified locally (capped at `--memory=512m` to match Render exactly) to keep idle usage around 400MB instead of ~490MB.

Steps:

1. Sign up at render.com (same account as the backend), connect your GitHub account if not already.
2. **New → Web Service**, pick this repo, set **Root Directory** to `keycloak`.
3. Render auto-detects `keycloak/Dockerfile` (Environment: Docker) — no Docker Command override needed, it's baked into the image.
4. Instance type: **Free** works (verified) — cold starts after ~15min idle, same tradeoff as the backend. Upgrade to Starter ($7/mo) if that ever feels too slow in practice; no config changes needed, just a tier bump.
5. Environment variables:
   ```
   KC_DB=postgres
   KC_DB_URL=jdbc:postgresql://<keycloak-neon-host>/<dbname>?sslmode=require
   KC_DB_USERNAME=<from the Keycloak Neon connection string>
   KC_DB_PASSWORD=<from the Keycloak Neon connection string>
   KC_BOOTSTRAP_ADMIN_USERNAME=admin
   KC_BOOTSTRAP_ADMIN_PASSWORD=<pick a strong password>
   ```
   (Note: drop Neon's `channel_binding=require` query param when splitting its connection string apart for `KC_DB_URL` — that's a libpq-specific parameter Keycloak's JDBC driver may not recognize; `sslmode=require` alone is sufficient for an encrypted connection.)
6. **Health Check Path**: leave blank. Keycloak's `/health/ready` lives on a separate management port this setup doesn't expose on the main port — an active health check here would target the wrong port and hang the deploy.
7. Deploy. Note the service's URL (`https://your-keycloak.onrender.com`).

### 2c. Configure the realm

The `kyma` realm, the `kyma-web` client (public, Direct Access Grants enabled), and the `kyma-backend` service-account client (confidential, `manage-users` role on `realm-management`) all auto-import on first boot from `keycloak/kyma-realm.json` — correct and already verified end-to-end locally. **This only applies on first import, though**: Keycloak's `--import-realm` uses an `IGNORE_EXISTING` strategy, so once a realm already exists in the target database (any environment that's been deployed before), re-deploying with an updated `kyma-realm.json` does **not** apply the changes — they have to be made by hand, once, via the Admin Console or Admin API, same as any other config drift. This bit us once already (a theme/display-name change silently didn't apply until done manually) — worth remembering before assuming a realm-JSON edit alone is enough on an existing deployment.

One thing still needs doing by hand regardless, since it's deliberately not in the committed export (a real credential that shouldn't be committed to the repo):

- `kyma-backend`'s client secret — the committed `kyma-realm.json` has a real-looking value in it from local dev; generate and set a **different** one for production via the Admin Console (**Clients** → `kyma-backend` → **Credentials** → **Regenerate**), then set that value as `KEYCLOAK_BACKEND_CLIENT_SECRET` on the backend Render service (step 3).

Also confirm **Clients** → `kyma-web` → **Valid redirect URIs** includes your real Cloudflare Workers (static assets) URL — used by the Keycloak-hosted theme pages (e.g. a future password-reset flow), even though regular login/registration no longer redirects there.

### Local development

`docker-compose up` runs a separate, independent Keycloak instance for local dev (dev mode, no real Postgres needed) — seeded from the same `keycloak/kyma-realm.json`, already configured for `http://localhost:5173`. It has no connection to the production Keycloak instance or database.

## 3. Backend — Render

1. **New → Web Service**, pick this repo, set **Root Directory** to `backend`.
2. Render detects the `Dockerfile` automatically (Environment: Docker).
3. Environment variables:
   - `DATABASE_URL` — the **app's** Neon connection string from step 1 (not Keycloak's)
   - `KEYCLOAK_URL` — the Keycloak service's URL from step 2b, e.g. `https://your-keycloak.onrender.com`
   - `KEYCLOAK_REALM` — `kyma`
   - `KEYCLOAK_CLIENT_ID` — `kyma-web`
   - `KEYCLOAK_BACKEND_CLIENT_ID` — `kyma-backend`
   - `KEYCLOAK_BACKEND_CLIENT_SECRET` — the secret you regenerated in step 2c (not the one committed in `kyma-realm.json`, that one's local-dev-only)
   - `NODE_ENV` — `production`
   - `CORS_ORIGIN` — leave blank for now; come back and set it once you have the frontend's URL from step 4
   - `PORT` — Render sets this itself; don't override it
4. Deploy. Confirm it works: `https://your-service.onrender.com/api/health` should return `{"success":true,...}`.

Free-tier note: same sleep/wake behavior as before — fine for a hobby project. One nuance specific to Keycloak-based auth: the backend caches Keycloak's JWKS signing keys after first use, so an already-issued token mostly keeps verifying fine even while Keycloak itself naps; it's new logins and near-expiry token refreshes that hit Keycloak's own cold start.

## 4. Frontend — Cloudflare Workers (static assets)

1. **Workers & Pages → Create → connect this repo**, using the Workers-with-static-assets build path (root directory `frontend`, build command `npm run build`, output directory `dist`).
2. Under the Worker's **Settings → Builds → Variables and secrets**, add:
   - `VITE_API_URL` — `https://your-service.onrender.com/api` (the backend URL from step 3, **with** `/api` on the end)
   - `VITE_KEYCLOAK_URL` — the Keycloak service's URL from step 2b
   - `VITE_KEYCLOAK_REALM` — `kyma`
   - `VITE_KEYCLOAK_CLIENT_ID` — `kyma-web`
3. Deploy. Cloudflare gives you a URL like `https://your-app.workers.dev`.
4. **Go back to Render** (the backend service) and set `CORS_ORIGIN` to that exact URL, then redeploy the backend.

Saving env vars alone doesn't rebuild an already-deployed Worker — it only takes effect on the *next* build. Trigger one with a new commit (or use the dashboard's own redeploy action if using the "Deployments" tab rather than the "New deployment" static-upload flow, which bypasses the build step entirely and won't pick up env vars at all).
6. **Go back to Keycloak's Admin Console** (step 2c.1) and confirm the `kyma-web` client's redirect URIs include this same URL.

At this point the app is live, with real login/registration/Google sign-in all handled by Keycloak, for $0/month (or ~$7-14/month if you've upgraded Keycloak and/or the backend off the free tier for faster cold starts).

## 5. Optional: a custom domain

Render and Cloudflare Workers (static assets) both support attaching a custom domain for free (you only pay if the domain itself isn't free). To use a genuinely free domain name instead of `*.workers.dev`:

- [free-for.dev's domain section](https://free-for.dev/#/?id=domain) lists options like `eu.org` (manual review, real custom domain) or various "js.org"-style community subdomain services.
- [DigitalPlat Domains](https://domain.digitalplat.org) (operated by EdgeAlphix LLC) is one such service — free subdomains under `*.dpdns.org`, `*.qzz.io`, `*.us.kg`, `*.xx.kg`, or `*.qd.je`. It's a real, ToS/AUP-governed registrar (not a throwaway), so a name here (e.g. `agora.dpdns.org`) is fine to actually launch on. Steps:
  1. Sign up at [dash.domain.digitalplat.org/auth/register](https://dash.domain.digitalplat.org/auth/register) and register a name, e.g. `agora.dpdns.org`.
  2. It supports "bring your own DNS" — delegate the domain's nameservers to Cloudflare (add the domain to a free Cloudflare account, which gives you two nameservers; set those as the domain's NS records in the DigitalPlat dashboard). This hands you full DNS record control (CNAME, etc.), which a bare subdomain registrar alone wouldn't give you.
  3. In Cloudflare's DNS tab for the zone, add a CNAME for the root (or `www`) pointing at the Cloudflare Workers (static assets) `*.workers.dev` address, a CNAME for `api` pointing at the Render backend's `*.onrender.com` address, and a CNAME for `auth` pointing at the Render Keycloak service's `*.onrender.com` address.
  4. Add each hostname as a custom domain in the respective dashboard (Cloudflare Workers (static assets), Render backend, Render Keycloak) — each will verify via the CNAME and issue its own TLS cert.
  5. Update `VITE_API_URL` (Cloudflare Workers (static assets)) to `https://api.agora.dpdns.org/api`, `CORS_ORIGIN` (Render backend) to `https://agora.dpdns.org`, and `KEYCLOAK_URL`/`VITE_KEYCLOAK_URL` (Render backend + Cloudflare Workers (static assets)) to `https://auth.agora.dpdns.org` — then update the `kyma-web` client's redirect URIs in Keycloak's Admin Console to match, and redeploy all three services.
- Whichever route you pick, all three dashboards have a "Custom Domains" tab where you add the hostname and follow their DNS instructions (usually just a CNAME record).

## Local Docker verification

The backend's `Dockerfile` was built and run locally against the project's Postgres container before writing this guide — `docker build` succeeded, and the container connected to the DB, ran `prisma migrate deploy`, and served `/api/health` correctly. If you want to reproduce that check yourself:

```bash
cd backend
docker build -t kyma-backend .
docker run --network social-network_default \
  -e DATABASE_URL="postgresql://social_platform:social_platform@social_platform_postgres:5432/social_platform?schema=public" \
  -e KEYCLOAK_URL="http://social_platform_keycloak:8080" \
  -e KEYCLOAK_REALM="kyma" \
  -e KEYCLOAK_CLIENT_ID="kyma-web" \
  -p 4001:4000 \
  kyma-backend
curl http://localhost:4001/api/health
```

The `keycloak/Dockerfile` image was similarly built and run locally (capped at `--memory=512m` to match Render's free tier exactly) before deploying — 13-20s boot, ~400MB/512MB idle memory, realm/client import verified via the Admin REST API.
