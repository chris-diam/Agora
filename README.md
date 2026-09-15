# Agora

An alternative, transparency-first social platform: local/national/international news, music & cultural events, artists, and communities — with a deterministic, user-controlled feed instead of an engagement-maximizing algorithm.

> **Status:** MVP in progress. Building in phases — architecture → database → backend → API → frontend → styling. See `PHASES.md`-style progress below.

> **Deploying this?** See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for a concrete free-tier stack (Neon + Render + Cloudflare Pages), verified against this repo's own `Dockerfile`.

## 1. Architecture

Clean **modular monolith** (not microservices): one Express/TypeScript backend, organized by layer, with each layer split by domain.

```
Route → Middleware (auth / validation) → Controller → Service → Prisma → PostgreSQL
```

- **Routes** — wiring only (path + middleware + controller).
- **Controllers** — parse `req`, call services, shape the HTTP response. No business logic.
- **Services** — all business logic and Prisma queries. Plain functions, easy to test and reuse.
- **Middleware** — JWT auth, Zod validation, centralized error handling.

**Design principle — transparent, user-controlled feeds:** there is no engagement-maximizing ranking algorithm. Every feed (`following`, `chronological`, `interests`, `local`) is a plain, deterministically-ordered query, and recommended items can carry a `reason` field (e.g. *"You follow this user"*, *"From your city"*). No ML, no hidden scoring.

Full architecture/database/API rationale lives in the project planning discussion; the Prisma schema (`backend/prisma/schema.prisma`) is the source of truth for data model decisions.

**Real-time layer:** Socket.io runs on the same HTTP server as the REST API (see `backend/src/server.ts`). Each authenticated connection joins a room named by its `userId`, so the server can push directly to a specific user with `emitToUser(userId, event, payload)` (`backend/src/lib/socket.ts`). Two events exist today:
- `notification:new` — fired when someone follows you.
- `message:new` — fired when a friend sends you a direct message.

**Friends & direct messages:** there's no separate friend-request table — a "friend" is anyone in a mutual `Follow` (you follow them and they follow you back), computed in `backend/src/services/friends.service.ts`. Direct messages (`Message` model) are restricted to friends only; messaging a non-mutual-follow returns a `403`.

### Project structure

```
social-network/
├── frontend/          # React + TypeScript + Vite (Phase 8)
├── backend/           # Node + TypeScript + Express + Prisma
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── config/        # env loading & validation
│       ├── controllers/   # HTTP layer, per domain
│       ├── services/      # business logic + Prisma queries, per domain
│       ├── routes/        # route wiring, per domain
│       ├── middleware/    # auth, validation, error handling
│       ├── validators/    # Zod schemas, per domain
│       ├── lib/           # Prisma client singleton
│       ├── utils/         # asyncHandler, apiResponse, pagination, AppError
│       ├── types/         # shared/augmented types (e.g. req.user)
│       └── app.ts         # Express app assembly
│   └── src/server.ts      # entry point (app.listen)
├── docker-compose.yml  # PostgreSQL for local dev
└── .gitignore
```

## 2. Requirements

- **Node.js 20 LTS** (a `.nvmrc` is provided — run `nvm use`). Node 16/18 are not supported: Prisma 6 and Vite both require 18+, and this project targets 20.
- **Docker + Docker Compose** (for PostgreSQL)
- npm (ships with Node)

## 3. Environment Variables

Backend config lives in `backend/.env` (gitignored). Copy the example and fill it in:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | `postgresql://social_platform:social_platform@localhost:5432/social_platform?schema=public` |
| `JWT_SECRET` | Secret used to sign auth tokens — **use a long random value, never commit it** | generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `PORT` | Backend HTTP port | `4000` |
| `NODE_ENV` | `development` \| `test` \| `production` | `development` |
| `GOOGLE_CLIENT_ID` | Optional — enables "Sign in with Google". Unset = the feature returns a clear "not configured" error instead of crashing. | a Google Cloud OAuth Client ID |
| `CORS_ORIGIN` | Optional — restricts CORS (and the Socket.io handshake) to one origin. Unset = reflects the request origin (fine for local dev). | `https://myapp.pages.dev` |

Env vars are validated at boot (`backend/src/config/env.ts`, via Zod) — the server refuses to start with missing/invalid config instead of failing confusingly later.

The `docker-compose.yml` Postgres credentials (`social_platform` / `social_platform`, db `social_platform`) match the example `DATABASE_URL` above — change both together if you customize them.

The frontend has its own `frontend/.env` (see `frontend/.env.example`): `VITE_GOOGLE_CLIENT_ID` (must match the backend's `GOOGLE_CLIENT_ID`) and `VITE_API_URL` (only needed in production — see `DEPLOYMENT.md`).

## 4. Installation

```bash
nvm use                 # switches to Node 20 per .nvmrc
cd backend
npm install
cp .env.example .env    # then edit JWT_SECRET, etc.
```

## 5. Running PostgreSQL

From the project root:

```bash
docker compose up -d postgres
```

This starts Postgres 16 on `localhost:5432` with a named volume (`postgres_data`) for persistence. Stop it with `docker compose down` (add `-v` to also wipe the data volume).

## 6. Running Migrations

From `backend/`:

```bash
npx prisma migrate dev --name <description>   # create + apply a migration in dev
npx prisma generate                            # regenerate the Prisma client (also runs automatically after migrate dev)
npx prisma studio                               # optional: browse the DB in a GUI
```

For deploying existing migrations without creating new ones (e.g. CI/production):

```bash
npx prisma migrate deploy
```

## 7. Starting the Backend

```bash
cd backend
npm run dev          # tsx watch — auto-restarts on file changes, http://localhost:4000
```

Other scripts:

```bash
npm run build        # tsc -> backend/dist
npm start            # run the compiled build (dist/server.js)
npm run typecheck    # tsc --noEmit
```

Health check: `GET http://localhost:4000/api/health` → `{ "success": true, "data": { "status": "ok", ... } }`

## 8. Starting the Frontend

```bash
cd frontend
npm install
npm run dev           # Vite dev server, http://localhost:5173
```

The dev server proxies `/api/*` to the backend at `http://localhost:4000` (see `frontend/vite.config.ts`), so the frontend and backend can be developed against each other without CORS configuration. Make sure the backend (and Postgres) are running first — see sections 5–7.

Other scripts:

```bash
npm run build         # tsc -b && vite build -> frontend/dist
npm run preview        # serve the production build locally
```

### Frontend structure

```
frontend/src/
├── api/          # one thin fetch wrapper per backend domain (auth, posts, events, ...)
├── types/        # shared TS types mirroring backend response shapes
├── context/      # AuthContext — token + current user, login/register/logout
├── hooks/        # TanStack Query hooks per domain (useEvents, useFeed, ...)
├── components/   # Navbar, Feed, PostCard, CreatePost, EventList, EventCard, LoginForm, RegisterForm, Pagination, ProtectedRoute
├── pages/        # one per route — Login, Register, Home, Feed, Profile, Events, EventDetails, CreateEvent, Communities, CreateCommunity, CreatePost
└── App.tsx       # router + QueryClientProvider + AuthProvider
```

Notes on a couple of deliberate choices:
- **Comments are inline**, expandable from each post card, rather than a separate "post details" page — keeps the page list matching the original plan while still exposing the full comment feature.
- **Interests and follow relationships surface through the Profile page** (an inline "Edit profile" panel handles bio/location/interests) rather than as separate pages, since only one Profile page was planned.
- Styling is intentionally plain Tailwind utility classes — no custom design system yet. Visual polish is the explicit last step per the project's priorities.

## API Conventions

All responses use a consistent envelope:

```jsonc
// success
{ "success": true, "data": { /* ... */ } }

// success, paginated
{ "success": true, "data": [ /* ... */ ], "pagination": { "page": 1, "limit": 20, "totalItems": 143, "totalPages": 8, "hasNextPage": true, "hasPrevPage": false } }

// error
{ "success": false, "message": "Post not found" }
```

List endpoints accept `?page=1&limit=20` (default limit 20, max 100).

## Build Phases

1. ~~Architecture, database design, Prisma schema, API plan~~ ✅
2. ~~Backend/Prisma/Docker/env infra scaffolding~~ ✅
3. ~~Auth, Users, Interests, Following~~ ✅
4. ~~Posts, Likes, Comments~~ ✅
5. ~~Events, Attendance, Filtering~~ ✅
6. ~~Communities~~ ✅
7. ~~Transparent feed system~~ ✅
8. ~~React frontend + API integration~~ ✅ (this state)
9. Styling and visual design (not started — functional UI only so far)
