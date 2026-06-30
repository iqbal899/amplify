import { Context } from "hono";
import { enrollCampaign } from "../services/enrollments-service";

export async function enrollCampaignController(
    c: Context
) {
    const campaignId = Number(c.req.param("id"));

    const creatorId = c.get("creatorId");

    try {
        const response = await enrollCampaign(
            campaignId,
            creatorId
        );

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
                    error instanceof Error
                        ? error.message
                        : "Internal Server Error",
            },
            404
        );
    }
}