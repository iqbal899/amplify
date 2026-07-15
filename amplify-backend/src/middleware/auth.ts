import { Context, Next } from "hono";
import { verifyToken } from "../utils/jwt";
import type { AppEnv } from "../types";

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return c.json(
      {
        success: false,
        message: "Authorization header missing",
      },
      401
    );
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = (await verifyToken(token)) as {
      creatorId: number;
    };

    c.set("creatorId", payload.creatorId);

    await next();
  } catch {
    return c.json(
      {
        success: false,
        message: "Invalid or expired token",
      },
      401
    );
  }
}