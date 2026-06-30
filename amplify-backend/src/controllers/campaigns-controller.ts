import { Context } from "hono";
import {
  getCampaignsSchema,
} from "../validators/campaign-validator";

import {
  getCampaigns as getCampaignsService,
  getCampaignById as getCampaignByIdService,
} from "../services/campaign-service";

export async function getCampaigns(c: Context) {
  const query = c.req.query();

  const result = getCampaignsSchema.safeParse(query);

  if (!result.success) {
    return c.json(
      {
        success: false,
        errors: result.error.issues,
      },
      400
    );
  }

  try {
    const campaigns = await getCampaignsService(result.data);

    return c.json({
      success: true,
      campaigns,
    });
  } catch (error) {
    console.error(error);

    return c.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      500
    );
  }
}

export async function getCampaignById(
  c: Context
) {
  const id = Number(c.req.param("id"));

  if (Number.isNaN(id)) {
    return c.json(
      {
        success: false,
        message: "Invalid campaign id",
      },
      400
    );
  }

  try {
    const campaign =
      await getCampaignByIdService(id);

    return c.json({
      success: true,
      campaign,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Internal Server Error",
      },
      404
    );
  }
}