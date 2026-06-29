import { Context } from "hono";
import { getCreatorProfile } from "../services/me-service";

import { updateMeSchema } from "../validators/auth-validator";
import { updateCreatorProfile } from "../services/me-service";

export async function getMe(c: Context) {
    try {
        const creatorId = c.get("creatorId");

        const creator = await getCreatorProfile(creatorId);

        return c.json({
            success: true,
            creator,
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
            500
        );
    }
}

export async function updateMe(c: Context) {
    const creatorId = c.get("creatorId");

    const body = await c.req.json();

    const result = updateMeSchema.safeParse(body);

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
        const creator = await updateCreatorProfile(
            creatorId,
            result.data
        );

        return c.json({
            success: true,
            creator,
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
            400
        );
    }
}
