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
├── validators/
└── index.ts
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
```

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

### 6. Start the development server

```bash
npm run dev
```

To make the dev server reachable from a physical device on the same network (e.g. testing the React Native app on a phone instead of a simulator), bind to all network interfaces:

```bash
npm run dev -- --ip 0.0.0.0
```

Then point the frontend's `API_BASE_URL` at your machine's LAN IP (not `localhost`), e.g. `http://192.168.x.x:8787`. Find your LAN IP with `hostname -I` (Linux) or `ipconfig getifaddr en0` (macOS).

---

## API Reference

**Auth legend:**
1. Public
2. Creator (JWT)
3. Admin (separate flow, deferred — see [Deferred Features](#deferred-features))

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
- payouts

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
- `Variables.db` — the per-request Drizzle instance, set by `middleware/db.ts`.
- `Variables.creatorId` — the authenticated creator's ID, set by `middleware/auth.ts`.

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
| POST | `/submissions/:id/refresh-views` | path: `id` | **[blackbox]** Fetch views → update `currentViews`, `lastCheckedAt`. |
| GET | `/payouts` | query: `status?, creatorId?, campaignId?` | Payout worklist (default `pending`) + creator UPI/context. |
| POST | `/payouts` | body: `submissionId` | Create pending payout for a milestone-hit submission (amount from `milestones`; one per submission). |
| PATCH | `/payouts/:id` | path: `id`; body: `upiReference, status` | Record `upiReference`, mark `paid` (stamps `paidAt`) or `failed`. |

Admin endpoints are planned to be gated by a shared secret rather than a role field in the schema.

**Current workaround:** Since `POST /campaigns` is not yet implemented as an API route, campaigns are created manually by inserting rows directly into the `campaigns` table via `psql` (or a Docker Postgres client) during development.

### External Integrations

- **Spotify** (Client Credentials, server-to-server) — used only in `POST /campaigns/preview`.
- **Instagram view fetching** — blackbox for now; downstream logic only consumes `reel_submissions.currentViews`.
- **YouTube views** — via YouTube Data API v3.
- **Cron** (Cloudflare Cron Trigger) — polls views and creates pending payouts when milestones are met.
- Payouts remain manual in v1: no payment-gateway API integration.

---

## Implementation Status

This repository currently implements all creator-facing APIs described in the project specification.

Admin functionality and external integrations are intentionally deferred.