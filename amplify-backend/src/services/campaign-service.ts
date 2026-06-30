import { and, eq } from "drizzle-orm";

import { db } from "../db/client";
import { campaigns } from "../db/schema/campaigns";

// getcampaigns function with filters for status, genre, language, page, and limit

type CampaignFilters = {
  status?: "open" | "full" | "closed";
  genre?: string;
  language?: string;
  page: number;
  limit: number;
};

export async function getCampaigns(
  filters: CampaignFilters
) {
  const conditions = [];

  if (filters.status) {
    conditions.push(eq(campaigns.status, filters.status));
  }

  if (filters.genre) {
    conditions.push(eq(campaigns.genre, filters.genre));
  }

  if (filters.language) {
    conditions.push(eq(campaigns.language, filters.language));
  }

  return await db
    .select()
    .from(campaigns)
    .where(
      conditions.length
        ? and(...conditions)
        : undefined
    )
    .limit(filters.limit)
    .offset((filters.page - 1) * filters.limit);
}

export async function getCampaignById(id: number) {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1);

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  return {
    ...campaign,
    spotsLeft:
      campaign.spotsTotal - (campaign.spotsFilled ?? 0),
  };
}

