import { Context } from "hono";
import { getCreatorProfile } from "../services/me-service";

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
  return c.json({
    message: "Update profile - TODO",
  });
}