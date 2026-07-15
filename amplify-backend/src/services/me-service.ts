import { eq } from "drizzle-orm";

import { creators } from "../db/schema/creators";
import { enrollments } from "../db/schema/enrollments";
import { campaigns } from "../db/schema/campaigns";
import { reelSubmissions } from "../db/schema/reel_submissions";
import { payouts } from "../db/schema/payouts";
import type { Database } from "../db/client";

export async function getCreatorProfile(db: Database, creatorId: number) {
  const [creator] = await db
    .select({
      id: creators.id,
      name: creators.name,
      email: creators.email,
      phone: creators.phone,
      instagramUsername: creators.instagramUsername,
      profileImage: creators.profileImage,
      createdAt: creators.createdAt,
      updatedAt: creators.updatedAt,
    })
    .from(creators)
    .where(eq(creators.id, creatorId))
    .limit(1);

  if (!creator) {
    throw new Error("Creator not found");
  }

  return creator;
}

type UpdateProfileInput = {
  name?: string;
  phone?: string;
  profileImage?: string;
  instagramUsername?: string;
};

export async function updateCreatorProfile(
  db: Database,
  creatorId: number,
  data: UpdateProfileInput
) {
  const [creator] = await db
    .update(creators)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(creators.id, creatorId))
    .returning({
      id: creators.id,
      name: creators.name,
      email: creators.email,
      phone: creators.phone,
      instagramUsername: creators.instagramUsername,
      profileImage: creators.profileImage,
      createdAt: creators.createdAt,
      updatedAt: creators.updatedAt,
    });

  if (!creator) {
    throw new Error("Creator not found");
  }

  return creator;
}

export async function getCreatorEnrollments(db: Database, creatorId: number) {
  return await db
    .select({
      enrollment: enrollments,
      campaign: campaigns,
    })
    .from(enrollments)
    .innerJoin(campaigns, eq(enrollments.campaignId, campaigns.id))
    .where(eq(enrollments.creatorId, creatorId));
}

export async function getCreatorSubmissions(db: Database, creatorId: number) {
  return await db
    .select({
      submission: reelSubmissions,
      campaign: campaigns,
    })
    .from(reelSubmissions)
    .innerJoin(enrollments, eq(reelSubmissions.enrollmentId, enrollments.id))
    .innerJoin(campaigns, eq(enrollments.campaignId, campaigns.id))
    .where(eq(enrollments.creatorId, creatorId));
}

export async function getCreatorPayouts(db: Database, creatorId: number) {
  return await db
    .select({
      payout: payouts,
      campaign: campaigns,
    })
    .from(payouts)
    .innerJoin(reelSubmissions, eq(payouts.submissionId, reelSubmissions.id))
    .innerJoin(enrollments, eq(reelSubmissions.enrollmentId, enrollments.id))
    .innerJoin(campaigns, eq(enrollments.campaignId, campaigns.id))
    .where(eq(payouts.creatorId, creatorId));
}