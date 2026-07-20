# amplify-admin

Internal panel for campaign operations and manual payouts. Next.js (App Router),
Tailwind, shadcn/ui.

```bash
npm install
cp .env.example .env.local     # point AMPLIFY_API_URL at the Worker
npm run dev                    # http://localhost:3000
```

The backend must be running (`cd ../amplify-backend && npm run dev`) with
`ADMIN_PASSWORD` set in its `.dev.vars`.

---

## The browser never talks to the Worker

Every API call goes through the Next server — server components for reads,
server actions for writes. Nothing calls the Worker from client JavaScript.

That is what lets the admin token live in an **httpOnly cookie**, unreachable
from client script. It matters more than usual here: that token can read every
creator's name, email, phone and UPI id, and can change where a payout is sent.
An XSS bug in an admin panel that kept its token in `localStorage` would hand
over all of it.

Two consequences:

- `AMPLIFY_API_URL` is **not** `NEXT_PUBLIC_`, so it is never inlined into the
  client bundle.
- The backend's CORS config is irrelevant to this app. It never sends a
  preflight, because the request originates server-side.

`proxy.ts` (Next 16's rename of Middleware) redirects signed-out visitors to
`/login`. It only checks that a cookie *exists* — it is a routing convenience,
not the security boundary. Authorisation is the Worker's job on every request.

---

## Screens

**Campaigns** — list, create, edit, and drive the lifecycle:

```
draft ──start──▶ open ──end & settle──▶ closed
```

Campaigns are created as drafts and are invisible to creators until started.
`Start` is disabled until the campaign has both milestones and a deadline,
either of which missing means nobody could ever be paid.

`End & settle` is irreversible — it settles every submission and writes payouts
— so it is gated behind typing the track name. It is also slow, because the
backend calls Instagram once per submission; the dialog says so, because an
operator who assumes it hung and retries would re-snapshot every reel.

A closed campaign renders read-only. Editing one cannot change what was already
paid, so the edit would only make the record disagree with the money.

**Payouts** — the worklist, filtered by pending / failed / paid.

> This screen moves no money. You send the transfer from your own UPI app, then
> record it here. The dialog is worded to make that unmissable — an operator who
> believed the button paid people would mark rows paid having paid nobody.

`Record payment` is disabled until the creator has a UPI id, because without one
there is no destination. You can fill it in from the same row; it saves against
the creator and is reused for later campaigns.

`Failed` is not terminal. A bounced transfer is ordinary, and the backend
refuses to issue a replacement payout row, so a failed payout stays payable.

---

## The milestone editor

`cumulativePayout` is **derived, not typed**.

Settlement pays the cumulative figure and ignores the increments, so an operator
who can type both can silently produce a payout that disagrees with the tiers
they think they authored. Here you enter the extra payout per tier and the
running total is computed — which is exactly what the API validates on write, so
the two cannot drift. The server action recomputes it again from the increments
rather than trusting the submitted JSON.

---

## Notes

- Reads use `cache: "no-store"`. An admin screen showing a stale payout status is
  worse than a slow one.
- The API has two error shapes — `{ message }` and `{ errors: [...] }` for Zod
  rejections. `lib/api.ts` flattens both; reading only `message` would render
  "undefined" for every validation failure.
- Amounts are strings end to end (Postgres `decimal`), formatted only at the
  edge. Money must not round-trip through a float.
