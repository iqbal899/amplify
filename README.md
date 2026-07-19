# Amplify

Creator-earnings platform. Brands run campaigns around a track; creators enroll, post a Reel using that audio, and get paid when their view count crosses a milestone before the campaign deadline.

> **Status: not yet working end to end.** The full pipeline is built and internally tested, but no view count has ever been read from Instagram — that is blocked on a Meta app. See [Current Status](#current-status).

---

## Repository layout

| Package | Stack | Purpose |
| --- | --- | --- |
| `amplify-frontend/` | Expo (SDK 56), React Native, expo-router, Zustand | Creator mobile app |
| `amplify-backend/` | Hono, Cloudflare Workers, Postgres, Drizzle | Creator-facing API + view-tracking cron |

Each package has its own README with setup detail. This document covers how they fit together.

---

## Architecture

```
┌─────────────────────┐
│  Expo app           │  creator signs up, browses campaigns,
│  (React Native)     │  enrolls, submits a reel URL
└──────────┬──────────┘
           │ JWT over HTTPS
           ▼
┌─────────────────────┐         ┌──────────────────────┐
│  Hono API           │────────▶│  Postgres            │
│  (Cloudflare        │         │  (Docker locally)    │
│   Workers)          │◀────────│                      │
└──────────┬──────────┘         └──────────────────────┘
           │                              ▲
           │ scheduled()                  │ append snapshots,
           ▼                              │ write payouts
┌─────────────────────┐                   │
│  Cron (*/15)        │───────────────────┘
│  poll + settle      │
└──────────┬──────────┘
           │ per-creator OAuth token
           ▼
┌─────────────────────┐
│  Instagram Graph    │  GET /{media-id}/insights?metric=views
│  API                │
└─────────────────────┘
```

The backend follows a layered structure: **routes → middleware (db + auth) → controllers → services → Drizzle**. Services take `db` as their first argument rather than importing a singleton, because Workers cannot reuse a socket across requests.

---

## The view-tracking pipeline

This is the core of the product and the part with the most subtlety.

### Why the official API, not scraping

Payouts are real money. A scraped number cannot be defended when a creator disputes their payout, and Meta's ToS prohibits it besides. We use **Instagram API with Instagram Login**, which means:

- Insights are readable **only for media owned by the authenticated account** — you cannot read views for an arbitrary reel URL.
- Each creator must connect a **Professional (Business or Creator)** Instagram account. Personal accounts expose no insights at all, so there is no degraded mode.
- We store a long-lived token per creator, encrypted at rest.

### Why snapshots, not a single column

A mutable `currentViews` column cannot answer *"how many views did this reel have when the campaign ended?"* once it has been overwritten. View counts also **go down** — Instagram retroactively strips views it judges inauthentic, which is exactly what happens to purchased ones.

So every reading is appended to `view_snapshots`. `reel_submissions.currentViews` is kept as a denormalised cache of the newest reading, but the snapshot history is the source of truth.

### Flow

1. **Connect** — creator authorises via OAuth. The app forwards only the `code`; the backend exchanges it (the client secret never ships in the bundle), upgrades to a long-lived token, verifies the account is professional, and stores it AES-256-GCM encrypted.
2. **Submit** — creator posts a reel URL. On first read the backend resolves it to an Instagram **media ID** by matching the shortcode against the creator's own media, and records `wentLiveAt` from the media's real publish timestamp.
3. **Poll** — hourly, the cron appends a snapshot per active submission. Failures are isolated per submission so one dead reel cannot stall the run.
4. **Settle** — every 15 minutes, campaigns past `endsAt` are closed. Each submission gets a final `settlement` snapshot, milestones are evaluated, and a payout row is written.

### Settlement rules

- Payout is computed from the **settlement reading**, not the highest ever recorded. A spike Instagram later reverses must not stay payable.
- If the live read fails (outage, expired token), settlement **falls back to the last snapshot at or before the deadline**. Without this, one 15-minute outage would close a campaign having paid nobody, irreversibly.
- A milestone requires **both** enough views **and** `minDaysLive` days since the reel went live. This is what discourages a burst of bought views right before the deadline. `wentLiveAt` is the anchor — `submittedAt` is only when the creator pasted a link.
- `payouts` is unique on `submissionId`, so a submission gets one row carrying the **cumulative** amount for its highest qualifying milestone.

---

## Data model

| Table | Purpose |
| --- | --- |
| `creators` | Account, credentials, Instagram connection (encrypted token, expiry, account type) |
| `campaigns` | Track, reward pool, spots, `endsAt`, `milestones` jsonb, status |
| `enrollments` | Creator ↔ campaign, unique per pair |
| `reel_submissions` | Reel URL, resolved `instagramMediaId`, `wentLiveAt`, cached `currentViews` |
| `view_snapshots` | **Append-only** view history: `views`, `reach`, `capturedAt`, `source` |
| `payouts` | Amount, status, UPI reference; one per submission |

`milestones` is author-entered JSON of the shape:

```json
[{ "views": 10000, "minDaysLive": 3, "incrementalPayout": 100, "cumulativePayout": 100 }]
```

Ordering is not trusted — the evaluator sorts before matching.

---

## Local setup

**Backend** (see `amplify-backend/README.md` for detail):

```bash
cd amplify-backend
npm install
docker compose up -d          # Postgres on :5432
npm run dev                   # Worker on :8787, bound to 0.0.0.0
```

Requires `.dev.vars` with `DATABASE_URL`, `JWT_SECRET`, `TOKEN_ENCRYPTION_KEY`, and the Instagram app credentials.

**Frontend:**

```bash
cd amplify-frontend
npm install
npx expo start --dev-client
```

The API base URL is derived from the Metro packager host, so the app follows your machine across networks automatically. Override with `EXPO_PUBLIC_API_URL`.

> **Expo Go will not work** for the Instagram flow. OAuth needs the custom `amplify://` scheme, which requires a development build (`npx expo run:ios` / `run:android`).

---

## Current status

### Working and verified

- Signup / login (JWT)
- Campaign browsing, enrollment, reel submission
- Instagram connect / disconnect / status endpoints — auth guards, validation, error surfacing
- Token encryption — round trip, non-determinism, wrong-key rejection
- Milestone evaluation — 20 unit tests incl. boundaries, unsorted input, `minDaysLive` gating
- Settlement against real Postgres — campaign closes, payout written at correct amount, post-deadline snapshots correctly ignored
- Cron handler fires and manages its own DB lifecycle

### Written but never executed against real data

Everything below has been tested only with synthetic view numbers:

- The OAuth round trip — no account has ever been connected
- `resolveMediaId` — never run against a real media list
- `fetchMediaInsights` — **has never returned a real view count**
- Token refresh
- The poller doing actual work

### Known gaps

| Issue | Impact |
| --- | --- |
| **No Meta app** | `INSTAGRAM_APP_ID`/`SECRET` are empty. Connect returns "not configured". Blocks everything above. |
| **Frontend hardcodes `currentViews: 0`** (`campaignStore.ts:94`) | UI shows zeros even once the backend returns real data. |
| **Migration journal is broken** | `__drizzle_migrations` is empty while all tables exist — the DB was built with `push`, never `migrate`. `npm run migrate` fails (silently, the spinner eats the error). Recent migrations were applied by hand. **Fix before deploying.** |
| `kyc.tsx:41` calls `setKYC` | That function does not exist on the auth store; the screen will crash. |
| No CORS middleware | Irrelevant on native, fatal for `expo start --web`. |
| `@supabase/supabase-js` is a dead dependency | Zero imports anywhere in `src/`. |

### Likely to break on first real contact

Untested seams, in rough order of risk:

1. **Shortcode matching** — we match `permalink.includes(shortcode)`; real permalink formats may differ from submitted URLs.
2. **Media list paging** — capped at 5 pages / 250 items, so a prolific creator's older reel may not be found.
3. **Insights response shape** — we parse `data[].values[0].value`.
4. **`account_type` values** — we gate on `BUSINESS` / `MEDIA_CREATOR` / `CREATOR`; anything else rejects a valid account.

---

## Next steps

**1. Unblock real testing** (everything else depends on this)

- Create a Meta app → Instagram → *API setup with Instagram login*
- Register `amplify://oauth/callback` as a valid OAuth redirect URI
- Fill `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET` in `amplify-backend/.dev.vars`
- Set `EXPO_PUBLIC_INSTAGRAM_CLIENT_ID` in `amplify-frontend/.env`
- Build a dev client (`npx expo run:android`)

In development mode your own Instagram account works as a test user without App Review. Connect it, then call `POST /submissions/:id/refresh-views` on one of your own reels — that single call validates media resolution, insights parsing, decryption, and the snapshot write at once.

**2. Start App Review early** — Advanced Access for `instagram_business_manage_insights` has its own lead time and gates any real user.

**3. Wire the frontend to real data** — remove the hardcoded `currentViews: 0`, and surface the snapshot history (`GET /submissions/:id/snapshots`) as a progress chart.

**4. Fix the migration journal** before the first deploy.

**5. Deferred, still open**

- Admin APIs (campaign CRUD, payout worklist) — campaigns are currently created by hand via `psql`
- YouTube support — the `platform` enum allows it, nothing implements it
- Payment gateway — payouts stay manual in v1
- Token-refresh cron — the function exists but nothing schedules it
- Fraud review — an implausible view curve should be inspectable before payout

---

## Conventions

- Every service takes `db` as its first parameter (Workers connection lifecycle).
- Validation is Zod at the controller boundary; failures return `{ success: false, errors: [...] }`.
- Other failures return `{ success: false, message: "..." }`. Clients should handle both.
- Secrets live in `.dev.vars` (gitignored) locally, Worker secrets in production.
