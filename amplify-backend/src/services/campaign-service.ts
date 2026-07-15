import { and, eq, ilike, or } from "drizzle-orm";

import { campaigns } from "../db/schema/campaigns";
import type { Database } from "../db/client";

type CampaignFilters = {
  status?: "open" | "full" | "closed";
  genre?: string;
  language?: string;
  search?: string;
  page: number;
  limit: number;
};

export async function getCampaigns(
  db: Database,
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

  if (filters.search) {
    conditions.push(
      or(
        ilike(campaigns.trackName, `%${filters.search}%`),
        ilike(campaigns.artistName, `%${filters.search}%`),
        ilike(campaigns.genre, `%${filters.search}%`),
        ilike(campaigns.language, `%${filters.search}%`),
        ilike(campaigns.description, `%${filters.search}%`)
      )!
    );
  }

  return await db
    .select()
    .from(campaigns)
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(filters.limit)
    .offset((filters.page - 1) * filters.limit);
}

export async function getCampaignById(db: Database, id: number) {
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
    spotsLeft: campaign.spotsTotal - (campaign.spotsFilled ?? 0),
  };
}