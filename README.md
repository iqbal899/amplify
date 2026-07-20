# Amplify

Creator-earnings platform. Brands run campaigns around a track; creators enroll, post a Reel using that audio, and get paid when their view count crosses a milestone before the campaign deadline.

> **Status: not yet working end to end.** The full pipeline is built and internally tested, but no view count has ever been read from Instagram — that is blocked on a Meta app. See [Current Status](#current-status).

---

## Repository layout

| Package | Stack | Purpose |
| --- | --- | --- |
| `amplify-frontend/` | Expo (SDK 56), React Native, expo-router, Zustand | Creator mobile app |
| `amplify-backend/` | Hono, Cloudflare Workers, Postgres, Drizzle | Creator-facing API, admin API, view-tracking cron |
| `amplify-admin/` | Next.js 16 (App Router), Tailwind, shadcn/ui | Internal panel: campaigns and manual payouts |

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
| `creators` | Account, credentials, `upiId` (payout destination, entered by an admin), Instagram connection (encrypted token, expiry, account type) |
| `campaigns` | Track, reward pool, spots, `endsAt`, `milestones` jsonb, status (`draft` → `open` → `closed`) |
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

Requires `.dev.vars` with `DATABASE_URL`, `JWT_SECRET`, `TOKEN_ENCRYPTION_KEY`, `ADMIN_PASSWORD`, and the Instagram app credentials.

**Frontend:**

```bash
cd amplify-frontend
npm install
npx expo start --dev-client
```

The API base URL is derived from the Metro packager host, so the app follows your machine across networks automatically. Override with `EXPO_PUBLIC_API_URL`.

> **Expo Go will not work** for the Instagram flow. OAuth needs the custom `amplify://` scheme, which requires a development build (`npx expo run:ios` / `run:android`).

---

## Setting up Instagram

Nothing in the view-tracking pipeline can run until a Meta app exists. This is configuration, not code — there is no code change that substitutes for an app ID.

The dependency chain is strictly ordered, and it currently breaks at the first link:

```
Meta app exists          ← start here
  └─ credentials in .dev.vars / .env
      └─ dev build (OAuth needs the amplify:// scheme)
          └─ creator connects account
              └─ token stored
                  └─ reel submitted
                      └─ views fetched
```

**You do not need App Review to test this.** In development mode your own Instagram account works as a test user. App Review is only required before real users can connect.

### 1. Create the Meta app

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps) → **Create App**
2. Add the **Instagram** product → **API setup with Instagram login**
3. Note the **Instagram App ID** and **Instagram App Secret** (these are *not* the same as the Facebook App ID/Secret shown elsewhere in the dashboard)

### 2. Register the redirect URI

Under *API setup with Instagram login* → **Business login settings**, add this as a valid OAuth redirect URI, exactly:

```
amplify://oauth/callback
```

This must match `scheme` in `app.json` (`amplify`) and the `makeRedirectUri` call in `useInstagramAuth.ts`. A mismatch fails at the very end of the flow, after the user has already approved — so it looks like a hang rather than an error.

The hook returns the resolved `redirectUri`, so log it and paste the exact string rather than typing it from memory.

### 3. Add yourself as a tester

Under **App roles → Roles**, add your own Instagram account as an *Instagram Tester*, then accept the invite from that account (Instagram → Settings → Apps and websites → Tester invites).

Your account must be a **Professional (Business or Creator)** account. Personal accounts expose no insights, and the backend rejects them at connect time. Switching is free: Instagram → Settings → Account type and tools.

### 4. Fill in credentials

`amplify-backend/.dev.vars`:

```env
INSTAGRAM_APP_ID=<Instagram App ID>
INSTAGRAM_APP_SECRET=<Instagram App Secret>
```

`amplify-frontend/.env`:

```env
EXPO_PUBLIC_INSTAGRAM_CLIENT_ID=<Instagram App ID>
```

Restart both servers — `wrangler dev` reads `.dev.vars` at startup, and Metro inlines `EXPO_PUBLIC_*` at bundle time.

Verify the backend picked them up:

```bash
curl -s -X POST http://127.0.0.1:8787/instagram/connect \
  -H "Authorization: Bearer <jwt>" -H "Content-Type: application/json" \
  -d '{"code":"test","redirectUri":"amplify://oauth/callback"}'
```

Unconfigured returns `"Instagram is not configured on the server"`. Configured returns an error *from Meta* instead — which means the credentials are being used.

### 5. Build a dev client

**Expo Go cannot do this flow.** It only runs the prebuilt Expo Go shell and has no `amplify://` scheme registered, so the OAuth callback can never return to the app. `npx expo start --dev-client` does not create a build — it only tells Metro to serve one.

```bash
cd amplify-frontend
npx expo run:android      # or run:ios
```

This runs prebuild → compile → install, and generates an `android/` (or `ios/`) directory. Budget ~10-15 min for the first build and ~3 GB of disk. Afterwards `npx expo start --dev-client` works normally, and JS changes need no rebuild.

### 6. Prove it works

Connect your account in the app, submit one of your own reels, then force a reading:

```bash
curl -s -X POST http://127.0.0.1:8787/submissions/<id>/refresh-views \
  -H "Authorization: Bearer <jwt>"
```

A real view count means media resolution, insights parsing, token decryption, and the snapshot write are all working — the whole pipeline in one call.

If it fails, the likely culprits in order are listed under [Likely to break on first real contact](#likely-to-break-on-first-real-contact).

---

## Admin

Campaign and payout operations, under `/admin/*`, rendered by `amplify-admin/`
(see its README for the panel itself). Payouts are manual in v1 — the API tracks
what is owed and records what was sent; **it moves no money**. An operator sends
the transfer from their own UPI app and records it afterwards.

The panel calls this API from the Next server, never the browser, so the admin
token stays in an httpOnly cookie.

### Auth

A single shared password in `ADMIN_PASSWORD` (worker secret; `.dev.vars`
locally). `POST /admin/login` returns a 12-hour JWT; every other route needs it
as `Authorization: Bearer`. There is no admin table, so a payout records *what*
happened but not *who* did it — fine for one operator, revisit for several.

Admin tokens are signed with `ADMIN_PASSWORD` mixed into the key, so **rotating
the password revokes every outstanding token**. With no admin table that is the
only revocation mechanism there is; without it, rotating after a suspected leak
would achieve nothing for 12 hours. Creator tokens are signed with the bare
secret and carry no `role`, so the two are not interchangeable in either
direction.

> **`/admin/login` is not rate limited.** Unlimited guesses against one shared
> password that gates the payout worklist (every creator's name, email, phone
> and UPI id) and `PATCH /admin/creators/:id/upi`, which can redirect where a
> pending payout goes. **Fix before the panel is internet-facing** — it needs a
> KV or Durable Object binding, neither of which is configured yet.

`ADMIN_ORIGIN` is the panel's origin, for CORS (comma-separated for several).
Unset it defaults to `http://localhost:5173`, so **production must set it**.

### Campaign lifecycle

```
draft ──start──▶ open ──end (or endsAt passes)──▶ closed
                  │                                 ▲
                  └──────────── full ───────────────┘
```

`full` is a running campaign that cannot take more creators. Polling and
settlement both treat it exactly like `open` — if they did not, a campaign would
stop accumulating snapshots the moment it filled up, or never close at all.
Nothing sets it automatically today; enrolment gates on the `spotsFilled`
counter, not on status.

Campaigns are created as `draft` and are invisible to creators until started —
both the campaign list and the by-id lookup exclude drafts, the latter because
`/campaigns/:id` is unauthenticated. `start` refuses a campaign with no deadline
or no milestones, either of which would mean nobody could ever be paid.

**`end` is not a status change.** It brings `endsAt` forward to now and then runs
the ordinary settlement. Writing `status: closed` directly would drop the
campaign out of the `open` filter that settlement and polling both use, closing
it permanently with nobody paid and no way back. Manual end and the cron share
one `settleCampaign` path so they cannot drift.

Ending calls Instagram once per submission, so it is much slower than the other
routes — do not retry a slow response, as a second run re-snapshots every reel.

| Route | Purpose |
| --- | --- |
| `POST /admin/login` | Exchange the password for a token |
| `GET/POST /admin/campaigns` | List (any status, with enrolment counts) / create as draft |
| `GET/PATCH /admin/campaigns/:id` | Read (drafts included) / edit; closed campaigns are frozen |
| `POST /admin/campaigns/:id/start` | draft → open |
| `POST /admin/campaigns/:id/end` | Settle and close early |
| `GET /admin/payouts` | Worklist: amount, destination UPI, reel, campaign |
| `POST /admin/payouts/:id/paid` | Record a transfer, with its reference |
| `POST /admin/payouts/:id/failed` | Mark a transfer failed |
| `PATCH /admin/creators/:id/upi` | Set a creator's payout UPI id |

Both payout transitions are conditioned on the row not already being `paid`, so
two operators working the same list cannot both pay one creator — the second
request gets a 409 rather than silently overwriting the first one's reference.

`failed` is deliberately **not** terminal. A bounced UPI transfer is the ordinary
case, and `payouts` is unique on `submissionId` so settlement can never issue a
replacement row; treating `failed` as final would strand money owed behind
hand-written SQL. Fix the creator's UPI id and mark it paid on the next attempt.

### Milestones

`POST`/`PATCH` validate milestone JSON strictly: each `cumulativePayout` must
equal the running total of `incrementalPayout` when tiers are sorted by views,
and no two tiers may share a view target. Settlement pays `cumulativePayout` and
ignores `incrementalPayout`, so a mismatch between them is invisible in
production — this is the only place it is caught.

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
- Admin API against real Postgres — login and token guards (both directions), milestone validation, draft invisibility, full draft → open → closed lifecycle, settlement writing a payout via the snapshot fallback, mark-paid and its double-pay guard
- Admin panel end to end in a real browser — sign-in, campaign create → start → end & settle, derived milestone totals, and the payout worklist through add-UPI → record-payment → paid

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
| CORS is scoped to `/admin/*` only | Added for the browser admin panel. Still absent on creator routes — irrelevant on native, fatal for `expo start --web`. |
| **`/admin/login` has no rate limiting** | Unlimited guesses against one shared password guarding the payout worklist and UPI destinations. Blocks putting the panel on the internet. |
| `PATCH /admin/campaigns/:id` can rewrite a live campaign | Milestones and `endsAt` are editable while creators are enrolled, so the terms can change after they have posted. Left open deliberately — extending a deadline is legitimate, cutting a payout tier is not, and the distinction is a policy call. |
| `@supabase/supabase-js` is a dead dependency | Zero imports anywhere in `src/`. |

### Likely to break on first real contact

Untested seams, in rough order of risk:

1. **Shortcode matching** — we match `permalink.includes(shortcode)`; real permalink formats may differ from submitted URLs.
2. **Media list paging** — capped at 5 pages / 250 items, so a prolific creator's older reel may not be found.
3. **Insights response shape** — we parse `data[].values[0].value`.
4. **`account_type` values** — we gate on `BUSINESS` / `MEDIA_CREATOR` / `CREATOR`; anything else rejects a valid account.

---

## Next steps

**1. Unblock real testing** — everything else depends on this. Full walkthrough in [Setting up Instagram](#setting-up-instagram).

**2. Start App Review early** — Advanced Access for `instagram_business_manage_insights` has its own lead time and gates any real user.

**3. Wire the frontend to real data** — remove the hardcoded `currentViews: 0`, and surface the snapshot history (`GET /submissions/:id/snapshots`) as a progress chart.

**4. Fix the migration journal** before the first deploy.

**5. Deferred, still open**

- Rate limiting on `/admin/login` — blocks putting the panel on the internet
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
