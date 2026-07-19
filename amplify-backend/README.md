# Amplify Backend

Backend API for the Amplify creator platform.

This project is built using Hono, Cloudflare Workers, PostgreSQL, and Drizzle ORM. It provides the creator-facing APIs for authentication, campaign browsing, enrollments, reel submissions, and payout history.

---

## Tech Stack

- Hono
- TypeScript
- Cloudflare Workers
- PostgreSQL
- Drizzle ORM
- JWT Authentication
- bcryptjs
- Zod

---

## Project Structure

```
src/
├── controllers/
├── db/
│   ├── client.ts
│   └── schema/
├── middleware/
│   ├── auth.ts
│   └── db.ts
├── routes/
├── services/
├── types.ts
├── utils/
│   ├── crypto.ts        # AES-256-GCM token encryption
│   └── jwt.ts
├── validators/
├── scheduled.ts         # cron entrypoint (poll + settle)
└── index.ts             # exports { fetch, scheduled }
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

This project runs on Cloudflare Workers via `wrangler dev`, which reads local secrets from **`.dev.vars`**, not `.env`.

Create a `.dev.vars` file in the project root:

```env
DATABASE_URL=postgres://user:pass@localhost:5432/dbname
JWT_SECRET=your-secret

# 32 bytes base64 — encrypts Instagram tokens at rest. Generate with:
#   openssl rand -base64 32
TOKEN_ENCRYPTION_KEY=

# Meta app credentials: App Dashboard > Instagram > API setup with Instagram login.
# The secret is used server-side only; the app never sees it.
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
```

If you used the Docker Compose Postgres below, `DATABASE_URL` is:

```
postgresql://amplify:amplify@localhost:5432/amplify
```

Without `INSTAGRAM_APP_ID`/`INSTAGRAM_APP_SECRET`, `POST /instagram/connect` returns a 500 explaining it is unconfigured; everything else works normally.

Create a `.env` file only if Docker Compose needs it for Postgres container setup:

```env
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
```

### 3. Start PostgreSQL using Docker

The project uses Docker Compose to run a local PostgreSQL instance.

```bash
docker compose up -d
```

To verify the container is running:

```bash
docker ps
```

To stop the database:

```bash
docker compose down
```

### 4. Generate database migrations

```bash
npm run generate
```

### 5. Apply migrations

```bash
npm run migrate
```

> **Known issue:** the migration journal is out of sync. `__drizzle_migrations` is empty while all tables exist, because the database was originally built with `drizzle-kit push` rather than `migrate`. As a result `npm run migrate` replays from `0000`, hits "already exists", and exits 1 — with the error swallowed by Drizzle's progress spinner, so it looks like a hang.
>
> Until this is repaired, apply new migrations by hand:
>
> ```bash
> docker exec -i amplify-backend-postgres-1 psql -U amplify -d amplify -v ON_ERROR_STOP=1 < drizzle/<migration>.sql
> ```
>
> This must be fixed before the first production deploy.

### 6. Start the development server

```bash
npm run dev
```

The `dev` script already passes `--ip 0.0.0.0`, so the server is reachable from a physical device on the same network. Wrangler's default is `127.0.0.1`, which a phone cannot reach.

The frontend derives its API host from the Metro packager URI, so it follows your machine across networks with no edit needed. Override with `EXPO_PUBLIC_API_URL` for tunnels or staging.

### 7. Testing the cron handler

Cron triggers do not fire in local dev unless you ask for them:

```bash
npx wrangler dev --ip 0.0.0.0 --test-scheduled
curl "http://127.0.0.1:8787/__scheduled?cron=*/15+*+*+*+*"
```

---

## API Reference

**Auth legend:**
1. Public
2. Creator (JWT)
3. Admin (separate flow, deferred — see [Deferred Features](#deferred-features))

### Health

| Verb | Route | Params | Auth | Summary |
| --- | --- | --- | --- | --- |
| GET | `/health` | — | Public | Liveness probe; returns `{ ok: true }`. |

### Auth & Creators

| Verb | Route | Params | Auth | Summary |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | body: `name, email, password, phone?` | Public | Create creator, hash password, return JWT. |
| POST | `/auth/login` | body: `email, password` | Public | Verify credentials, return JWT. |
| GET | `/me` | — | Creator | Logged-in creator's profile. |
| PATCH | `/me` | body: `name?, phone?, profileImage?, instagramUsername?` | Creator | Update own profile. |

### Campaigns

| Verb | Route | Params | Auth | Summary |
| --- | --- | --- | --- | --- |
| GET | `/campaigns` | query: `status?, genre?, language?, page?, limit?` | Public | Browse campaigns. |
| GET | `/campaigns/:id` | path: `id` | Public | Campaign detail (milestones, spots left). |

### Enrollments

| Verb | Route | Params | Auth | Summary |
| --- | --- | --- | --- | --- |
| POST | `/campaigns/:id/enroll` | path: `id` | Creator | Claim a spot; rejects if full/closed/duplicate; bumps `spotsFilled`. |
| GET | `/me/enrollments` | — | Creator | Creator's enrollments + campaign details. |

Enrollment Rules

- Campaign must exist.
- Campaign must be open.
- Campaign must have available spots.
- Duplicate enrollments are not allowed.
- Campaign spot count is updated atomically using a database transaction.

### Reel Submissions

| Verb | Route | Params | Auth | Summary |
| --- | --- | --- | --- | --- |
| POST | `/enrollments/:id/submission` | path: `id`; body: `reelUrl, platform` | Creator | Submit posted reel (one per enrollment); starts `pending`, `currentViews=0`. |
| GET | `/me/submissions` | — | Creator | Creator's submissions + enrollment/campaign info. |

Submission Rules

- Enrollment must exist.
- Enrollment must belong to the authenticated creator.
- Only one submission is allowed per enrollment.
- New submissions are created with:
  - `verificationStatus = pending`
  - `currentViews = 0`

### Instagram connection

| Verb | Route | Params | Auth | Summary |
| --- | --- | --- | --- | --- |
| GET | `/instagram/status` | — | Creator | Connection state. Never returns the token itself. |
| POST | `/instagram/connect` | body: `code, redirectUri` | Creator | Exchange OAuth code → long-lived token; verify professional account; store encrypted. |
| DELETE | `/instagram/disconnect` | — | Creator | Clear the stored connection. |

The app performs the OAuth authorize step and forwards only the resulting `code`. The exchange happens here so the client secret never ships in the app bundle, and the access token never reaches the device.

### View tracking

| Verb | Route | Params | Auth | Summary |
| --- | --- | --- | --- | --- |
| POST | `/submissions/:id/refresh-views` | path: `id` | Creator | Force a reading now; appends a `manual` snapshot. |
| GET | `/submissions/:id/snapshots` | path: `id` | Creator | View history (newest first, max 500). |

Both are scoped to the authenticated creator's own submissions, so nobody can burn another creator's API quota.

### Payouts

| Verb | Route | Params | Auth | Summary |
| --- | --- | --- | --- | --- |
| GET | `/me/payouts` | — | Creator | Creator's payout history + related submission/campaign info. |

---

## Authentication

Protected endpoints require a JWT access token.

```
Authorization: Bearer <jwt_token>
```

Passwords are hashed using bcrypt before being stored.

---

## Validation

Request validation is handled using Zod.

Invalid requests return appropriate validation errors before reaching the service layer.

---

## Current Architecture

The project follows a layered architecture.

```
Routes
    ↓
Middleware (db + auth)
    ↓
Controllers
    ↓
Services
    ↓
Database
```

Responsibilities:

- Routes define API endpoints.
- Middleware attaches a per-request database connection and handles authentication.
- Controllers process HTTP requests and responses.
- Services contain business logic and receive the database connection as a parameter.
- Drizzle ORM handles database operations.

---

## Database & Data Access

The application uses **PostgreSQL** with **Drizzle ORM** for type-safe database access and schema management.

Current database tables:

- creators
- campaigns
- enrollments
- reel_submissions
- view_snapshots
- payouts

`view_snapshots` is **append-only**. A single mutable `currentViews` column cannot answer "how many views did this reel have when the campaign ended?" once overwritten, and view counts can decrease when Instagram retroactively strips inauthentic views. `reel_submissions.currentViews` remains as a denormalised cache of the newest reading so the app can read it without a join, but the snapshot history is the source of truth for anything involving money.

### Connection Handling (Cloudflare Workers)

Cloudflare Workers execute each request in an isolated context; sockets and other I/O objects created during one request cannot be reused in a later request. Because of this, the database connection is **not** a module-level singleton.

Instead:

- `db/client.ts` exports a `createDb()` factory that opens a new `pg.Pool` (with `max: 1`) per invocation.
- `middleware/db.ts` calls this factory at the start of every request, attaches the resulting `db` instance to Hono's context (`c.set("db", db)`), and closes the pool after the response is sent using `ctx.executionCtx.waitUntil(pool.end())`.
- Every service function receives `db` as its first parameter instead of importing a shared instance, so the correct per-request connection is always used.

This avoids intermittent request hangs that occur when a pooled connection from a previous (already-destroyed) request context is reused.

### Migrations

Database schema changes are managed using **Drizzle Kit** migrations.

```bash
npm run generate
npm run migrate
```

### Transactions

Database transactions are used to ensure data consistency for operations that modify multiple tables.

Current transaction implementation: `POST /campaigns/:id/enroll`

- **Post-Campaign Enrollment**
  - Creates a new enrollment.
  - Increments the campaign's `spotsFilled` count.
  - Both operations are executed atomically to prevent inconsistent data.

### SQL Joins

The backend uses SQL joins through Drizzle ORM to efficiently retrieve related data in a single database query.

Current join implementations include:

- **GET /me/enrollments**
  - Retrieves creator enrollments together with the associated campaign details.

- **GET /me/submissions**
  - Retrieves creator submissions together with their enrollment and campaign information.

- **GET /me/payouts**
  - Retrieves creator payouts together with the related submission and campaign information.

Using joins reduces the number of database queries, avoids the N+1 query problem, and provides richer API responses.

---

## Types

Shared Hono context typing lives in `src/types.ts` as `AppEnv`:

- `Bindings.DATABASE_URL` — the Postgres connection string, sourced from `.dev.vars` locally or Worker secrets in production.
- `Bindings.INSTAGRAM_APP_ID` / `Bindings.INSTAGRAM_APP_SECRET` — Meta app credentials, server-side only.
- `Bindings.TOKEN_ENCRYPTION_KEY` — 32 bytes base64; encrypts creator access tokens at rest.
- `Variables.db` — the per-request Drizzle instance, set by `middleware/db.ts`.
- `Variables.creatorId` — the authenticated creator's ID, set by `middleware/auth.ts`.

Cloudflare runtime globals (`ScheduledController`, `ExecutionContext`) come from `worker-configuration.d.ts`, generated by `npm run cf-typegen`. Rerun it after changing `wrangler.jsonc`.

All routes, controllers, and middleware are typed against `AppEnv` to keep `c.get()`/`c.set()` calls type-safe.

---

## Deferred Features

The following features are intentionally not implemented as they are outside the current project scope.

### Admin APIs

| Verb | Route | Params | Summary |
| --- | --- | --- | --- |
| POST | `/campaigns/preview` | body: `spotifyTrackId` | Spotify lookup → prefill track fields (no DB write). |
| POST | `/campaigns` | body: `trackName, artistName, spotifyTrackId?, genre?, language?, albumArt?, previewUrl?, description?, rewardPool, spotsTotal, endsAt, milestones[]` | Create campaign (defaults `open`). |
| PATCH | `/campaigns/:id` | path: `id`; body: editable fields + `status` | Edit campaign / set status (`open`/`full`/`closed`). |
| GET | `/campaigns/:id/enrollments` | path: `id` | Who enrolled in a campaign. |
| PATCH | `/enrollments/:id` | path: `id`; body: `status` | Set `active`/`completed`/`rejected`. |
| GET | `/submissions` | query: `verificationStatus?, campaignId?` | Review queue. |
| PATCH | `/submissions/:id` | path: `id`; body: `verificationStatus` | Verify/reject a reel. |
| GET | `/payouts` | query: `status?, creatorId?, campaignId?` | Payout worklist (default `pending`) + creator UPI/context. |
| PATCH | `/payouts/:id` | path: `id`; body: `upiReference, status` | Record `upiReference`, mark `paid` (stamps `paidAt`) or `failed`. |

Admin endpoints are planned to be gated by a shared secret rather than a role field in the schema.

**Current workaround:** Since `POST /campaigns` is not yet implemented as an API route, campaigns are created manually by inserting rows directly into the `campaigns` table via `psql` (or a Docker Postgres client) during development.

### External Integrations

- **Spotify** (Client Credentials, server-to-server) — used only in `POST /campaigns/preview`. Not implemented.
- **YouTube views** — via YouTube Data API v3. The `platform` enum permits `youtube`, but nothing implements it; `getTrackableSubmissions` filters to Instagram only.
- Payouts remain manual in v1: no payment-gateway API integration.

**Instagram view fetching and the settlement cron are no longer deferred** — see [View Tracking](#view-tracking-implementation) below.

---

## View Tracking (implementation)

### Services

| File | Responsibility |
| --- | --- |
| `services/instagram-service.ts` | OAuth: code exchange, long-lived token, professional-account gating |
| `services/instagram-views-service.ts` | Media-ID resolution, insights fetch, token refresh |
| `services/tracking-service.ts` | Snapshots, milestone evaluation, settlement |
| `scheduled.ts` | Cron entrypoint |
| `utils/crypto.ts` | AES-256-GCM token encryption (Web Crypto, no polyfill) |

### Cron

`wrangler.jsonc` declares `*/15 * * * *`. The handler settles due campaigns every run and polls view counts on the hourly tick — nobody is paid on five-minute granularity, and each submission costs an API call.

`scheduled()` receives no Hono context, so unlike the request path it builds and tears down its own `createDb()` pool.

### Settlement rules

- Payout uses the **settlement reading**, not the maximum ever recorded — a spike Instagram later reverses must not remain payable.
- If the live read fails, settlement falls back to the **last snapshot at or before `endsAt`**. Without this, a brief outage would close a campaign having paid nobody.
- A milestone needs **both** enough views **and** `minDaysLive` days since `wentLiveAt` (the reel's real publish time, not `submittedAt`).
- `payouts` is unique on `submissionId`: one row per submission, carrying the `cumulativePayout` of its highest qualifying milestone.
- Milestone ordering in the jsonb is not trusted; the evaluator sorts first.

### Failure handling

| Condition | Behaviour |
| --- | --- |
| Graph error 190 | Token dead → skip, creator must reconnect. Submission untouched so tracking resumes. |
| Graph error 100 / 24 | Reel deleted or account went private → mark `rejected`. |
| Reel not in creator's media | Usually someone else's reel → mark `rejected`. |
| Any single submission throwing | Isolated; the polling run continues. |

---

## Implementation Status

Creator-facing APIs, the Instagram connection flow, and the view-tracking/settlement pipeline are implemented. Admin functionality remains deferred.

**Caveat:** the Instagram integration has never run against real data — there is no Meta app yet, so `fetchMediaInsights` has never returned a real view count. All tracking tests used synthetic values. See the root `README.md` for the full status breakdown and the untested seams.