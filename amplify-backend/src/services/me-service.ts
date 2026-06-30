import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { creators } from "../db/schema/creators";

import { enrollments } from "../db/schema/enrollments";
import { campaigns } from "../db/schema/campaigns";

import { reelSubmissions } from "../db/schema/reel_submissions";

export async function getCreatorProfile(
    creatorId: number
) {
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

export async function getCreatorEnrollments(
    creatorId: number
) {
    return await db
        .select({
            enrollment: enrollments,
            campaign: campaigns,
        })
        .from(enrollments)
        .innerJoin(
            campaigns,
            eq(
                enrollments.campaignId,
                campaigns.id
            )
        )
        .where(
            eq(enrollments.creatorId, creatorId)
        );
}

// Get all submissions for a creator along with the campaign details
export async function getCreatorSubmissions(
    creatorId: number
) {
    return await db
        .select({
            submission: reelSubmissions,
            campaign: campaigns,
        })
        .from(reelSubmissions)
        .innerJoin(
            enrollments,
            eq(
                reelSubmissions.enrollmentId,
                enrollments.id
            )
        )
        .innerJoin(
            campaigns,
            eq(
                enrollments.campaignId,
                campaigns.id
            )
        )
        .where(
            eq(enrollments.creatorId, creatorId)
        );
}