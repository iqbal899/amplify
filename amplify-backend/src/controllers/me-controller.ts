import { Context } from "hono";

import {
  getCreatorProfile,
  updateCreatorProfile,
  getCreatorEnrollments,
  getCreatorSubmissions,
  getCreatorPayouts,
} from "../services/me-service";

import { updateMeSchema } from "../validators/auth-validator";
import type { AppEnv } from "../types";

export async function getMe(c: Context<AppEnv>) {
  const db = c.get("db");

  try {
    const creatorId = c.get("creatorId");

    const creator = await getCreatorProfile(db, creatorId);

    return c.json({
      success: true,
      creator,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      500
    );
  }
}

export async function updateMe(c: Context<AppEnv>) {
  const db = c.get("db");
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
    const creator = await updateCreatorProfile(db, creatorId, result.data);

    return c.json({
      success: true,
      creator,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      400
    );
  }
}

export async function getMyEnrollments(c: Context<AppEnv>) {
  const db = c.get("db");
  const creatorId = c.get("creatorId");

  try {
    const enrollments = await getCreatorEnrollments(db, creatorId);

    return c.json({
      success: true,
      enrollments,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      500
    );
  }
}

// Get all submissions for the logged-in creator
export async function getMySubmissions(c: Context<AppEnv>) {
  const db = c.get("db");
  const creatorId = c.get("creatorId");

  try {
    const submissions = await getCreatorSubmissions(db, creatorId);

    return c.json({
      success: true,
      submissions,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      500
    );
  }
}

// Get all payouts for the logged-in creator
export async function getMyPayouts(c: Context<AppEnv>) {
  const db = c.get("db");
  const creatorId = c.get("creatorId");

  try {
    const payouts = await getCreatorPayouts(db, creatorId);

    return c.json({
      success: true,
      payouts,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      500
    );
  }
}