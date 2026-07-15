import { Context } from "hono";
import { enrollCampaign } from "../services/enrollments-service";
import type { AppEnv } from "../types";

export async function enrollCampaignController(c: Context<AppEnv>) {
  const db = c.get("db");
  const campaignId = Number(c.req.param("id"));

  const creatorId = c.get("creatorId");

  try {
    const response = await enrollCampaign(db, campaignId, creatorId);

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
      404
    );
  }
}