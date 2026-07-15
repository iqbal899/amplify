import { Context } from "hono";

import { submissionSchema } from "../validators/submissions-validator";
import { submitReelService } from "../services/submissions-service";
import type { AppEnv } from "../types";

export async function submitReel(c: Context<AppEnv>) {
  const db = c.get("db");
  const enrollmentId = Number(c.req.param("id"));

  const creatorId = c.get("creatorId");

  const body = await c.req.json();

  const result = submissionSchema.safeParse(body);

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
    const response = await submitReelService(
      db,
      enrollmentId,
      creatorId,
      result.data
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
          error instanceof Error ? error.message : "Internal Server Error",
      },
      400
    );
  }
}