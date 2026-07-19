import { Context } from "hono";
import { and, desc, eq } from "drizzle-orm";

import { submissionSchema } from "../validators/submissions-validator";
import { submitReelService } from "../services/submissions-service";
import { reelSubmissions } from "../db/schema/reel_submissions";
import { enrollments } from "../db/schema/enrollments";
import { viewSnapshots } from "../db/schema/view_snapshots";
import { snapshotSubmission } from "../services/tracking-service";
import type { AppEnv } from "../types";

export async function submitReel(c: Context<AppEnv>) {
  const db = c.get("db");
  const enrollmentId = Number(c.req.param("id"));

  const creatorId = c.get("creatorId");

  const body = await c.req.json();

  const result = submissionSchema.safeParse(body);

  if (!result.success) {
    return c.json(
      {
        success: false,
        errors: result.error.issues,
      },
      400
    );
  }

  try {
    const response = await submitReelService(
      db,
      enrollmentId,
      creatorId,
      result.data
    );

    return c.json(
      {
        success: true,
        ...response,
      },
      201
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      400
    );
  }
}

/** Loads a submission only if it belongs to the authenticated creator. */
async function findOwnedSubmission(
  db: AppEnv["Variables"]["db"],
  submissionId: number,
  creatorId: number
) {
  const [submission] = await db
    .select({
      submissionId: reelSubmissions.id,
      creatorId: enrollments.creatorId,
      reelUrl: reelSubmissions.reelUrl,
      instagramMediaId: reelSubmissions.instagramMediaId,
      platform: reelSubmissions.platform,
    })
    .from(reelSubmissions)
    .innerJoin(enrollments, eq(reelSubmissions.enrollmentId, enrollments.id))
    .where(
      and(
        eq(reelSubmissions.id, submissionId),
        eq(enrollments.creatorId, creatorId)
      )
    )
    .limit(1);

  return submission ?? null;
}

/**
 * Forces a fresh reading for one submission.
 *
 * Scoped to the creator's own submissions — otherwise anyone could burn another
 * creator's API quota.
 */
export async function refreshSubmissionViews(c: Context<AppEnv>) {
  const db = c.get("db");
  const creatorId = c.get("creatorId");

  const submissionId = Number(c.req.param("id"));

  if (!Number.isInteger(submissionId)) {
    return c.json({ success: false, message: "Invalid submission id" }, 400);
  }

  const submission = await findOwnedSubmission(db, submissionId, creatorId);

  if (!submission) {
    return c.json({ success: false, message: "Submission not found" }, 404);
  }

  try {
    const insights = await snapshotSubmission(db, c.env, submission, "manual");

    if (!insights) {
      return c.json(
        {
          success: false,
          message:
            "Could not read views. Reconnect Instagram, or check the reel is still public and was posted from your connected account.",
        },
        400
      );
    }

    return c.json({
      success: true,
      views: insights.views,
      reach: insights.reach,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to refresh views",
      },
      400
    );
  }
}

/** View history for one submission — powers a progress-over-time chart. */
export async function getSubmissionSnapshots(c: Context<AppEnv>) {
  const db = c.get("db");
  const creatorId = c.get("creatorId");

  const submissionId = Number(c.req.param("id"));

  if (!Number.isInteger(submissionId)) {
    return c.json({ success: false, message: "Invalid submission id" }, 400);
  }

  const submission = await findOwnedSubmission(db, submissionId, creatorId);

  if (!submission) {
    return c.json({ success: false, message: "Submission not found" }, 404);
  }

  const snapshots = await db
    .select({
      views: viewSnapshots.views,
      reach: viewSnapshots.reach,
      capturedAt: viewSnapshots.capturedAt,
      source: viewSnapshots.source,
    })
    .from(viewSnapshots)
    .where(eq(viewSnapshots.submissionId, submissionId))
    .orderBy(desc(viewSnapshots.capturedAt))
    .limit(500);

  return c.json({ success: true, snapshots });
}