import { sql, and, eq } from "drizzle-orm";
import { enrollments } from "../db/schema/enrollments";

import { db } from "../db/client";
import { campaigns } from "../db/schema/campaigns";

export async function enrollCampaign(
  campaignId: number,
  creatorId: number
) {
  // creatorId will be used later
  console.log("Creator ID:", creatorId);

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!campaign) {
    throw new Error("Campaign not found");
  }
  //check if the campaign is open for enrollment
  if (campaign.status !== "open") {
    throw new Error("Campaign is not open");
  }
  //if open check if the campaign is full
  if ((campaign.spotsFilled ?? 0) >= campaign.spotsTotal) {
    throw new Error("Campaign is full");
  }

  //check if the creator is already enrolled in the campaign
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

  // return campaign;
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