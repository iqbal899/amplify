import { sql, and, eq } from "drizzle-orm";
import { enrollments } from "../db/schema/enrollments";
import { campaigns } from "../db/schema/campaigns";
import type { Database } from "../db/client";

export async function enrollCampaign(
  db: Database,
  campaignId: number,
  creatorId: number
) {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  if (campaign.status !== "open") {
    throw new Error("Campaign is not open");
  }

  if ((campaign.spotsFilled ?? 0) >= campaign.spotsTotal) {
    throw new Error("Campaign is full");
  }

  const [existingEnrollment] = await db
    .select()
    .from(enrollments)
    .where(
      and(
        eq(enrollments.campaignId, campaignId),
        eq(enrollments.creatorId, creatorId)
      )
    )
    .limit(1);

  if (existingEnrollment) {
    throw new Error("You are already enrolled in this campaign");
  }

  const enrollment = await db.transaction(async (tx) => {
    const [enrollment] = await tx
      .insert(enrollments)
      .values({
        campaignId,
        creatorId,
      })
      .returning();

    await tx
      .update(campaigns)
      .set({
        spotsFilled: sql`${campaigns.spotsFilled} + 1`,
      })
      .where(eq(campaigns.id, campaignId));

    return enrollment;
  });

  return {
    message: "Enrolled successfully",
    enrollment,
  };
}