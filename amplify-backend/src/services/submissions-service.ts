import { eq } from "drizzle-orm";

import { enrollments } from "../db/schema/enrollments";
import { reelSubmissions } from "../db/schema/reel_submissions";
import type { Database } from "../db/client";

type SubmissionInput = {
  reelUrl: string;
  platform: "instagram" | "youtube";
};

export async function submitReelService(
  db: Database,
  enrollmentId: number,
  creatorId: number,
  data: SubmissionInput
) {
  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);

  if (!enrollment) {
    throw new Error("Enrollment not found");
  }

  if (enrollment.creatorId !== creatorId) {
    throw new Error("You are not allowed to submit for this enrollment");
  }

  const [existingSubmission] = await db
    .select()
    .from(reelSubmissions)
    .where(eq(reelSubmissions.enrollmentId, enrollmentId))
    .limit(1);

  if (existingSubmission) {
    throw new Error("A submission already exists for this enrollment");
  }

  const [submission] = await db
    .insert(reelSubmissions)
    .values({
      enrollmentId,
      reelUrl: data.reelUrl,
      platform: data.platform,
    })
    .returning();

  return {
    message: "Submission created successfully",
    submission,
  };
}