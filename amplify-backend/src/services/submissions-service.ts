import { eq } from "drizzle-orm";

import { db } from "../db/client";

import { enrollments } from "../db/schema/enrollments";
import { reelSubmissions } from "../db/schema/reel_submissions";

type SubmissionInput = {
  reelUrl: string;
  platform: "instagram" | "youtube";
};

export async function submitReelService(
  enrollmentId: number,
  creatorId: number,
  data: SubmissionInput
) {
  // Rule 1: Enrollment must exist
  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);

  if (!enrollment) {
    throw new Error("Enrollment not found");
  }

  // Rule 2: Enrollment must belong to logged-in creator
  if (enrollment.creatorId !== creatorId) {
    throw new Error(
      "You are not allowed to submit for this enrollment"
    );
  }

  // Rule 3: Only one submission per enrollment
  const [existingSubmission] = await db
    .select()
    .from(reelSubmissions)
    .where(eq(reelSubmissions.enrollmentId, enrollmentId))
    .limit(1);

  if (existingSubmission) {
    throw new Error(
      "A submission already exists for this enrollment"
    );
  }

  // Rule 4: Create submission
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