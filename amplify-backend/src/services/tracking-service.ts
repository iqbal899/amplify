import { and, desc, eq, inArray, isNotNull, lte } from "drizzle-orm";

import { campaigns } from "../db/schema/campaigns";
import { enrollments } from "../db/schema/enrollments";
import { reelSubmissions } from "../db/schema/reel_submissions";
import { viewSnapshots } from "../db/schema/view_snapshots";
import { payouts } from "../db/schema/payouts";

import {
  fetchMediaInsights,
  getCreatorAccessToken,
  resolveMediaId,
  InstagramMediaUnavailableError,
  InstagramTokenExpiredError,
} from "./instagram-views-service";

import type { Database } from "../db/client";

type Milestone = {
  views: number;
  minDaysLive: number;
  incrementalPayout: number;
  cumulativePayout: number;
};

type TrackingEnv = {
  TOKEN_ENCRYPTION_KEY: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Highest milestone a submission qualifies for.
 *
 * Both conditions must hold: enough views AND enough days live. A reel that
 * hits the view target on day one still has to wait out `minDaysLive`, which is
 * what discourages a burst of bought views right before the deadline.
 *
 * Pure function so it can be tested without touching Instagram or the database.
 */
export function evaluateMilestone(
  milestones: Milestone[] | null | undefined,
  views: number,
  daysLive: number
): { index: number; milestone: Milestone } | null {
  if (!milestones?.length) {
    return null;
  }

  // Milestones are author-entered JSON; do not trust their ordering.
  const ordered = milestones
    .map((milestone, index) => ({ milestone, index }))
    .sort((a, b) => a.milestone.views - b.milestone.views);

  let qualified: { index: number; milestone: Milestone } | null = null;

  for (const entry of ordered) {
    const meetsViews = views >= entry.milestone.views;
    const meetsAge = daysLive >= (entry.milestone.minDaysLive ?? 0);

    if (meetsViews && meetsAge) {
      qualified = entry;
    }
  }

  return qualified;
}

export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

type SubmissionRow = {
  submissionId: number;
  creatorId: number;
  reelUrl: string;
  instagramMediaId: string | null;
  platform: string;
};

/**
 * Takes one reading for one submission and appends it to the history.
 *
 * Resolves and caches the media id on first use. Returns null when the reading
 * could not be taken — a dead reel or an expired token should not abort the
 * whole polling run.
 */
export async function snapshotSubmission(
  db: Database,
  env: TrackingEnv,
  submission: SubmissionRow,
  source: "poll" | "settlement" | "manual" = "poll"
): Promise<{ views: number; reach: number | null } | null> {
  try {
    const accessToken = await getCreatorAccessToken(
      db,
      env.TOKEN_ENCRYPTION_KEY,
      submission.creatorId
    );

    let mediaId = submission.instagramMediaId;
    let wentLiveAt: Date | null = null;

    if (!mediaId) {
      const resolved = await resolveMediaId(accessToken, submission.reelUrl);

      if (!resolved) {
        // Not in their media list — usually someone else's reel.
        await db
          .update(reelSubmissions)
          .set({ verificationStatus: "rejected", lastCheckedAt: new Date() })
          .where(eq(reelSubmissions.id, submission.submissionId));

        return null;
      }

      mediaId = resolved.mediaId;
      wentLiveAt = resolved.timestamp ? new Date(resolved.timestamp) : null;
    }

    const insights = await fetchMediaInsights(accessToken, mediaId);

    await db.insert(viewSnapshots).values({
      submissionId: submission.submissionId,
      views: insights.views,
      reach: insights.reach,
      source,
    });

    // currentViews is a denormalised cache of the newest snapshot so the app
    // can read it without a join. The snapshot table remains the source of truth.
    await db
      .update(reelSubmissions)
      .set({
        instagramMediaId: mediaId,
        currentViews: insights.views,
        lastCheckedAt: new Date(),
        verificationStatus: "verified",
        ...(wentLiveAt ? { wentLiveAt } : {}),
      })
      .where(eq(reelSubmissions.id, submission.submissionId));

    return insights;
  } catch (error) {
    if (error instanceof InstagramMediaUnavailableError) {
      await db
        .update(reelSubmissions)
        .set({ lastCheckedAt: new Date(), verificationStatus: "rejected" })
        .where(eq(reelSubmissions.id, submission.submissionId));

      return null;
    }

    if (error instanceof InstagramTokenExpiredError) {
      // Creator must reconnect; leave the submission alone so it resumes
      // tracking once they do.
      return null;
    }

    throw error;
  }
}

/**
 * Newest reading taken at or before the deadline.
 *
 * Deliberately not the maximum ever recorded: Instagram retroactively strips
 * views it decides are inauthentic, and a spike that gets reversed must not
 * remain payable.
 */
export async function getViewsAtDeadline(
  db: Database,
  submissionId: number,
  deadline: Date
): Promise<number | null> {
  const [snapshot] = await db
    .select({ views: viewSnapshots.views })
    .from(viewSnapshots)
    .where(
      and(
        eq(viewSnapshots.submissionId, submissionId),
        lte(viewSnapshots.capturedAt, deadline)
      )
    )
    .orderBy(desc(viewSnapshots.capturedAt))
    .limit(1);

  return snapshot?.views ?? null;
}

/** Submissions belonging to campaigns that are still open. */
export async function getTrackableSubmissions(
  db: Database
): Promise<SubmissionRow[]> {
  const rows = await db
    .select({
      submissionId: reelSubmissions.id,
      creatorId: enrollments.creatorId,
      reelUrl: reelSubmissions.reelUrl,
      instagramMediaId: reelSubmissions.instagramMediaId,
      platform: reelSubmissions.platform,
    })
    .from(reelSubmissions)
    .innerJoin(enrollments, eq(reelSubmissions.enrollmentId, enrollments.id))
    .innerJoin(campaigns, eq(enrollments.campaignId, campaigns.id))
    .where(
      and(
        // `full` is still a running campaign — it just cannot take more
        // creators. Tracking only `open` would stop snapshotting the moment a
        // campaign filled up, which is exactly when it matters most.
        inArray(campaigns.status, ["open", "full"]),
        eq(reelSubmissions.platform, "instagram")
      )
    );

  return rows;
}

/**
 * Polls every trackable submission. Failures are isolated per submission so one
 * bad reel cannot stop the run.
 */
export async function pollAllSubmissions(db: Database, env: TrackingEnv) {
  const submissions = await getTrackableSubmissions(db);

  let succeeded = 0;
  let failed = 0;

  for (const submission of submissions) {
    try {
      const result = await snapshotSubmission(db, env, submission, "poll");
      if (result) succeeded++;
      else failed++;
    } catch {
      failed++;
    }
  }

  return { total: submissions.length, succeeded, failed };
}

type SettleableCampaign = {
  id: number;
  endsAt: Date | null;
  milestones: unknown;
};

/**
 * Settles and closes one campaign.
 *
 * Takes one final `settlement` snapshot per submission and pays against THAT
 * reading — not the highest ever seen. A spike that Instagram later reverses
 * must not be payable.
 *
 * Separate from `settleDueCampaigns` because closing a campaign by hand has to
 * run this exact path. Flipping `status` to `closed` on its own would drop the
 * campaign out of the `open` filter every other query here uses, closing it
 * permanently with nobody paid and no way back.
 */
export async function settleCampaign(
  db: Database,
  env: TrackingEnv,
  campaign: SettleableCampaign
) {
  const settledAt = campaign.endsAt ?? new Date();

  const submissions = await db
    .select({
      submissionId: reelSubmissions.id,
      creatorId: enrollments.creatorId,
      reelUrl: reelSubmissions.reelUrl,
      instagramMediaId: reelSubmissions.instagramMediaId,
      platform: reelSubmissions.platform,
      wentLiveAt: reelSubmissions.wentLiveAt,
      submittedAt: reelSubmissions.submittedAt,
    })
    .from(reelSubmissions)
    .innerJoin(enrollments, eq(reelSubmissions.enrollmentId, enrollments.id))
    .where(eq(enrollments.campaignId, campaign.id));

  let paidCount = 0;

  for (const submission of submissions) {
    const live = await snapshotSubmission(
      db,
      env,
      submission,
      "settlement"
    ).catch(() => null);

    // A failed live read must not silently zero out a creator's payout —
    // Instagram being down for one 15-minute window would otherwise close the
    // campaign with nobody paid. Fall back to the last reading taken at or
    // before the deadline, which is what the history exists for.
    const views =
      live?.views ?? (await getViewsAtDeadline(db, submission.submissionId, settledAt));

    if (views === null) continue;

    // Fall back to submittedAt only if the reel's real publish time was
    // never resolved; it is the more conservative (later) of the two.
    const liveFrom = submission.wentLiveAt ?? submission.submittedAt;
    const daysLive = daysBetween(liveFrom, settledAt);

    const qualified = evaluateMilestone(
      campaign.milestones as Milestone[] | null,
      views,
      daysLive
    );

    if (!qualified) continue;

    // payouts is unique on submissionId, so this is the single cumulative
    // payout for the campaign rather than one row per milestone.
    await db
      .insert(payouts)
      .values({
        creatorId: submission.creatorId,
        submissionId: submission.submissionId,
        amount: String(qualified.milestone.cumulativePayout),
        status: "pending",
      })
      .onConflictDoNothing();

    paidCount++;
  }

  await db
    .update(campaigns)
    .set({ status: "closed" })
    .where(eq(campaigns.id, campaign.id));

  await db
    .update(enrollments)
    .set({ status: "completed" })
    .where(eq(enrollments.campaignId, campaign.id));

  return {
    campaignId: campaign.id,
    submissions: submissions.length,
    paid: paidCount,
  };
}

/** Closes every campaign whose deadline has passed. Called by the cron. */
export async function settleDueCampaigns(db: Database, env: TrackingEnv) {
  const due = await db
    .select({
      id: campaigns.id,
      endsAt: campaigns.endsAt,
      milestones: campaigns.milestones,
    })
    .from(campaigns)
    .where(
      and(
        // Must match getTrackableSubmissions. If `full` were settleable but not
        // pollable (or vice versa) a filled campaign would either stop
        // accumulating snapshots or never close at all.
        inArray(campaigns.status, ["open", "full"]),
        isNotNull(campaigns.endsAt),
        lte(campaigns.endsAt, new Date())
      )
    );

  const results = [];

  for (const campaign of due) {
    results.push(await settleCampaign(db, env, campaign));
  }

  return results;
}
