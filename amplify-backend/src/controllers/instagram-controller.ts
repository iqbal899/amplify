import { Context } from "hono";

import { connectInstagramSchema } from "../validators/instagram-validator";
import {
  connectInstagramAccount,
  disconnectInstagramAccount,
  getInstagramStatus,
} from "../services/instagram-service";

import type { AppEnv } from "../types";

export const connectInstagram = async (c: Context<AppEnv>) => {
  const db = c.get("db");
  const creatorId = c.get("creatorId");

  const body = await c.req.json();

  const result = connectInstagramSchema.safeParse(body);

  if (!result.success) {
    return c.json(
      {
        success: false,
        errors: result.error.issues,
      },
      400
    );
  }

  if (
    !c.env.INSTAGRAM_APP_ID ||
    !c.env.INSTAGRAM_APP_SECRET ||
    !c.env.TOKEN_ENCRYPTION_KEY
  ) {
    return c.json(
      {
        success: false,
        message:
          "Instagram is not configured on the server. Set INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET and TOKEN_ENCRYPTION_KEY.",
      },
      500
    );
  }

  try {
    const connection = await connectInstagramAccount(
      db,
      c.env,
      creatorId,
      result.data
    );

    return c.json(
      {
        success: true,
        instagram: connection,
      },
      200
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to connect Instagram",
      },
      400
    );
  }
};

export const disconnectInstagram = async (c: Context<AppEnv>) => {
  const db = c.get("db");
  const creatorId = c.get("creatorId");

  try {
    const response = await disconnectInstagramAccount(db, creatorId);

    return c.json({ success: true, ...response }, 200);
  } catch (error) {
    return c.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to disconnect Instagram",
      },
      400
    );
  }
};

export const instagramStatus = async (c: Context<AppEnv>) => {
  const db = c.get("db");
  const creatorId = c.get("creatorId");

  try {
    const status = await getInstagramStatus(db, creatorId);

    return c.json({ success: true, instagram: status }, 200);
  } catch (error) {
    return c.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load Instagram status",
      },
      400
    );
  }
};
