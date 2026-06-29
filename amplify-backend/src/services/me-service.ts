import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { creators } from "../db/schema/creators";

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