# Deployment Guide

A concrete, all-free stack for getting this app live on the internet. Every piece here has a permanent free tier (no credit card needed for the ones marked ✅), and the backend's `Dockerfile` has been built and run-tested locally against Postgres before writing this.

## The stack

| Piece | Service | Why |
|---|---|---|
| Database | [Neon](https://neon.tech) ✅ | Serverless Postgres, generous free tier, just a connection string |
| Backend API | [Render](https://render.com) ✅ | Free Web Service, builds straight from the repo's `Dockerfile` |
| Frontend | [Cloudflare Pages](https://pages.cloudflare.com) ✅ | Free static hosting, connects to the repo, builds on every push |
| Domain | Render/Pages give you a free subdomain automatically (`*.onrender.com`, `*.pages.dev`) — no separate registration needed to go live. A custom domain from [free-for.dev's domain list](https://free-for.dev/#/?id=domain) is an optional extra step layered on top (see bottom). |

All three dashboards deploy by connecting to a **GitHub repo** — that's the one prerequisite.

## 0. Prerequisite: push this repo to GitHub

This project is a local git repo with no commits yet and no remote. To deploy anywhere via Render/Cloudflare Pages, the code needs to live on GitHub first:

1. Create a free GitHub account if you don't have one.
2. Create a new **empty** repository (no README/license — this project already has one).
3. Locally: commit and push (I can do the commit if you confirm — I don't commit without being asked):
   ```bash
   git add -A
   git commit -m "Initial commit"
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin master
   ```

## 1. Database — Neon

1. Sign up at neon.tech, create a project (any region close to you).
2. Copy the connection string it gives you (starts `postgresql://...`). That's your production `DATABASE_URL`.
3. Nothing else to configure — migrations run automatically when the backend container starts (see the `Dockerfile`'s `CMD`).

## 2. Backend — Render

1. Sign up at render.com, connect your GitHub account.
2. **New → Web Service**, pick this repo, set **Root Directory** to `backend`.
3. Render will detect the `Dockerfile` automatically (Environment: Docker).
4. Set these environment variables in Render's dashboard (from `backend/.env.example`):
   - `DATABASE_URL` — the Neon connection string from step 1
   - `JWT_SECRET` — generate one: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
   - `JWT_EXPIRES_IN` — `7d`
   - `NODE_ENV` — `production`
   - `GOOGLE_CLIENT_ID` — leave blank for now (see the Google sign-in section below)
   - `CORS_ORIGIN` — leave blank for now; come back and set it once you have the frontend's URL from step 3
   - `PORT` — Render sets this itself; don't override it
5. Deploy. Once live, note the URL Render gives you (`https://your-service.onrender.com`) — that's your backend's public URL. Confirm it works: `https://your-service.onrender.com/api/health` should return `{"success":true,...}`.

Free-tier note: Render's free web services sleep after ~15 minutes of no traffic and take a few seconds to wake on the next request — fine for a hobby project, just expect the first request after idle to be slow. That sleep/wake also drops any open Socket.io connections; the frontend's socket client reconnects automatically once the service wakes back up, so live notifications/messages resume without a page reload.

Render's free web services support WebSocket connections natively (no extra config) — the same `CORS_ORIGIN` you set below also governs the Socket.io handshake, since both use the same Express `env.CORS_ORIGIN` value (see `backend/src/server.ts`).

## 3. Frontend — Cloudflare Pages

1. Sign up at Cloudflare, go to **Workers & Pages → Create → Pages → Connect to Git**, pick this repo.
2. Build settings:
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. Environment variable (from `frontend/.env.example`):
   - `VITE_API_URL` — `https://your-service.onrender.com/api` (the backend URL from step 2, **with** `/api` on the end)
   - `VITE_GOOGLE_CLIENT_ID` — leave blank for now
4. Deploy. Cloudflare gives you a URL like `https://your-app.pages.dev`.
5. **Go back to Render** and set `CORS_ORIGIN` to that exact URL (`https://your-app.pages.dev`, no trailing slash), then redeploy the backend so it only accepts requests from your real frontend.

At this point the app is live at your `*.pages.dev` URL, talking to a real Postgres database, for $0/month.

## 4. Optional: Google sign-in

Only needed if you want the "Sign in with Google" button to actually work:

1. [Google Cloud Console](https://console.cloud.google.com) → create/select a project.
2. **APIs & Services → OAuth consent screen** — set it up (External, fill in the required fields).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → Application type: **Web application**.
4. Under **Authorized JavaScript origins**, add both your Pages URL (`https://your-app.pages.dev`) and, for local dev, `http://localhost:5173`.
5. Copy the **Client ID** it gives you and set it as `GOOGLE_CLIENT_ID` on Render **and** `VITE_GOOGLE_CLIENT_ID` on Cloudflare Pages — same value, both places. Redeploy both.

## 5. Optional: a custom domain

Render and Cloudflare Pages both support attaching a custom domain for free (you only pay if the domain itself isn't free). To use a genuinely free domain name instead of `*.pages.dev`:

- [free-for.dev's domain section](https://free-for.dev/#/?id=domain) lists options like `eu.org` (manual review, real custom domain) or various "js.org"-style community subdomain services.
- Once you have one, both Render and Cloudflare Pages have a "Custom Domains" tab where you add it and follow their DNS instructions (usually a CNAME record pointing at your `*.onrender.com` / `*.pages.dev` address).

## Local Docker verification

The backend's `Dockerfile` was built and run locally against the project's Postgres container before writing this guide — `docker build` succeeded, and the container connected to the DB, ran `prisma migrate deploy`, and served `/api/health` correctly. If you want to reproduce that check yourself:

```bash
cd backend
docker build -t social-platform-backend .
docker run --network social-network_default \
  -e DATABASE_URL="postgresql://social_platform:social_platform@social_platform_postgres:5432/social_platform?schema=public" \
  -e JWT_SECRET="test-secret" \
  -p 4001:4000 \
  social-platform-backend
curl http://localhost:4001/api/health
```
