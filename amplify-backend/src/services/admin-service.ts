import { and, count, desc, eq, ne } from "drizzle-orm";

import { campaigns } from "../db/schema/campaigns";
import { creators } from "../db/schema/creators";
import { enrollments } from "../db/schema/enrollments";
import { payouts } from "../db/schema/payouts";
import { reelSubmissions } from "../db/schema/reel_submissions";
import { settleCampaign } from "./tracking-service";

import type { Database } from "../db/client";

type TrackingEnv = { TOKEN_ENCRYPTION_KEY: string };

/** Raised for operator error (bad id, wrong state) rather than a bug. */
export class AdminRequestError extends Error {
  constructor(message: string, readonly status: 400 | 404 | 409 = 400) {
    super(message);
  }
}

type CampaignInput = {
  trackName?: string;
  artistName?: string;
  spotifyTrackId?: string;
  genre?: string;
  language?: string;
  albumArt?: string;
  previewUrl?: string;
  description?: string;
  rewardPool?: number;
  spotsTotal?: number;
  endsAt?: Date;
  milestones?: {
    views: number;
    minDaysLive: number;
    incrementalPayout: number;
    cumulativePayout: number;
  }[];
};

// decimal columns round-trip as strings in Drizzle; numbers are silently wrong.
function toDecimal(value: number | undefined) {
  return value === undefined ? undefined : String(value);
}

export async function listCampaigns(
  db: Database,
  filters: { status?: "draft" | "open" | "full" | "closed"; page: number; limit: number }
) {
  return await db
    .select({
      id: campaigns.id,
      trackName: campaigns.trackName,
      artistName: campaigns.artistName,
      rewardPool: campaigns.rewardPool,
      spotsTotal: campaigns.spotsTotal,
      spotsFilled: campaigns.spotsFilled,
      endsAt: campaigns.endsAt,
      status: campaigns.status,
      createdAt: campaigns.createdAt,
      enrolledCount: count(enrollments.id),
    })
    .from(campaigns)
    .leftJoin(enrollments, eq(enrollments.campaignId, campaigns.id))
    .where(filters.status ? eq(campaigns.status, filters.status) : undefined)
    .groupBy(campaigns.id)
    .orderBy(desc(campaigns.createdAt))
    .limit(filters.limit)
    .offset((filters.page - 1) * filters.limit);
}

/** Unlike the creator-facing lookup, this returns drafts. */
export async function getCampaign(db: Database, id: number) {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1);

  if (!campaign) {
    throw new AdminRequestError("Campaign not found", 404);
  }

  return campaign;
}

/**
 * Campaigns are created as drafts, never live. Creating straight into `open`
 * would make a half-written campaign — wrong milestones, wrong deadline —
 * enrollable the instant the row lands.
 */
export async function createCampaign(db: Database, data: CampaignInput) {
  const [campaign] = await db
    .insert(campaigns)
    .values({
      trackName: data.trackName!,
      artistName: data.artistName!,
      spotifyTrackId: data.spotifyTrackId,
      genre: data.genre,
      language: data.language,
      albumArt: data.albumArt,
      previewUrl: data.previewUrl,
      description: data.description,
      rewardPool: toDecimal(data.rewardPool),
      spotsTotal: data.spotsTotal!,
      endsAt: data.endsAt,
      milestones: data.milestones,
      status: "draft",
    })
    .returning();

  return campaign;
}

export async function updateCampaign(
  db: Database,
  id: number,
  data: CampaignInput
) {
  const existing = await getCampaign(db, id);

  // Editing a closed campaign cannot change what was already paid out, so the
  // edit would only make the record disagree with the money that moved.
  if (existing.status === "closed") {
    throw new AdminRequestError("Cannot edit a closed campaign", 409);
  }

  // Drizzle throws on an empty .set(); an empty PATCH is operator error.
  if (!Object.values(data).some((value) => value !== undefined)) {
    throw new AdminRequestError("No fields to update", 400);
  }

  const [campaign] = await db
    .update(campaigns)
    .set({
      ...data,
      rewardPool: toDecimal(data.rewardPool),
    })
    .where(eq(campaigns.id, id))
    .returning();

  return campaign;
}

/** draft → open. This is the point a campaign becomes visible to creators. */
export async function startCampaign(db: Database, id: number) {
  const existing = await getCampaign(db, id);

  if (existing.status !== "draft") {
    throw new AdminRequestError(
      `Campaign is already ${existing.status}`,
      409
    );
  }

  if (!existing.endsAt) {
    throw new AdminRequestError(
      "Campaign has no deadline; it would never settle",
      400
    );
  }

  if (!existing.milestones?.length) {
    throw new AdminRequestError(
      "Campaign has no milestones; nobody could be paid",
      400
    );
  }

  const [campaign] = await db
    .update(campaigns)
    .set({ status: "open" })
    .where(eq(campaigns.id, id))
    .returning();

  return campaign;
}

/**
 * Ends a campaign early.
 *
 * Brings the deadline forward to now and then runs the ordinary settlement.
 * The `endsAt` write is what makes this correct rather than cosmetic: every
 * payout is computed against the deadline, so settling while `endsAt` is still
 * in the future would evaluate `minDaysLive` against the wrong instant and pay
 * the wrong tier.
 */
export async function endCampaign(
  db: Database,
  env: TrackingEnv,
  id: number
) {
  const existing = await getCampaign(db, id);

  if (existing.status === "closed") {
    throw new AdminRequestError("Campaign is already closed", 409);
  }

  if (existing.status === "draft") {
    throw new AdminRequestError("Campaign was never started", 409);
  }

  // Same guard as startCampaign, because closing cannot be undone. Campaigns
  // predating that guard can still be open with no milestones, and settling one
  // would close it permanently having paid nobody, with every enrollment marked
  // completed and no way to reopen it.
  if (!existing.milestones?.length) {
    throw new AdminRequestError(
      "Campaign has no milestones; ending it would pay nobody and cannot be undone",
      400
    );
  }

  const endsAt = new Date();

  await db.update(campaigns).set({ endsAt }).where(eq(campaigns.id, id));

  return await settleCampaign(db, env, {
    id: existing.id,
    endsAt,
    milestones: existing.milestones,
  });
}

/**
 * The payout worklist.
 *
 * Carries everything needed to actually send money and to justify the amount:
 * the destination UPI id, the reel, and the view count it was settled on.
 */
export async function listPayouts(
  db: Database,
  filters: { status?: "pending" | "paid" | "failed"; page: number; limit: number }
) {
  return await db
    .select({
      id: payouts.id,
      amount: payouts.amount,
      status: payouts.status,
      upiReference: payouts.upiReference,
      createdAt: payouts.createdAt,
      paidAt: payouts.paidAt,

      creatorId: creators.id,
      creatorName: creators.name,
      creatorEmail: creators.email,
      creatorPhone: creators.phone,
      creatorUpiId: creators.upiId,

      submissionId: reelSubmissions.id,
      reelUrl: reelSubmissions.reelUrl,

      // The cached newest reading, NOT necessarily the one this payout was
      // computed from: if the live read failed at settlement, the amount came
      // from the last snapshot before the deadline while this stayed older.
      // For the authoritative figure read the `settlement` snapshot.
      currentViews: reelSubmissions.currentViews,

      campaignId: campaigns.id,
      trackName: campaigns.trackName,
      artistName: campaigns.artistName,
    })
    .from(payouts)
    .innerJoin(creators, eq(payouts.creatorId, creators.id))
    .innerJoin(reelSubmissions, eq(payouts.submissionId, reelSubmissions.id))
    .innerJoin(enrollments, eq(reelSubmissions.enrollmentId, enrollments.id))
    .innerJoin(campaigns, eq(enrollments.campaignId, campaigns.id))
    .where(filters.status ? eq(payouts.status, filters.status) : undefined)
    .orderBy(desc(payouts.createdAt))
    .limit(filters.limit)
    .offset((filters.page - 1) * filters.limit);
}

/**
 * Records that money was sent by hand.
 *
 * Accepts `failed` as well as `pending`. A bounced UPI transfer is the ordinary
 * case, not an exception — the creator fixes their VPA and the operator sends it
 * again — and `payouts` is unique on `submissionId`, so settlement can never
 * issue a replacement row. Treating `failed` as terminal would strand money owed
 * behind hand-written SQL.
 *
 * `paid` is excluded, so two operators working the same list cannot both mark
 * one payout paid and overwrite each other's reference; the second update
 * matches nothing and is reported as a conflict.
 */
export async function markPayoutPaid(
  db: Database,
  id: number,
  upiReference: string
) {
  const [payout] = await db
    .update(payouts)
    .set({ status: "paid", upiReference, paidAt: new Date() })
    .where(and(eq(payouts.id, id), ne(payouts.status, "paid")))
    .returning();

  if (!payout) {
    throw new AdminRequestError(
      "Payout not found, or has already been paid",
      409
    );
  }

  return payout;
}

/** Reversible: a failed payout can still be marked paid on a later attempt. */
export async function markPayoutFailed(db: Database, id: number) {
  const [payout] = await db
    .update(payouts)
    .set({ status: "failed" })
    .where(and(eq(payouts.id, id), ne(payouts.status, "paid")))
    .returning();

  if (!payout) {
    throw new AdminRequestError(
      "Payout not found, or has already been paid",
      409
    );
  }

  return payout;
}

/** Creators do not enter their own UPI id; an admin fills it in from the panel. */
export async function setCreatorUpiId(
  db: Database,
  creatorId: number,
  upiId: string
) {
  const [creator] = await db
    .update(creators)
    .set({ upiId, updatedAt: new Date() })
    .where(eq(creators.id, creatorId))
    .returning({
      id: creators.id,
      name: creators.name,
      upiId: creators.upiId,
    });

  if (!creator) {
    throw new AdminRequestError("Creator not found", 404);
  }

  return creator;
}
