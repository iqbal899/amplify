import { Context, Next } from "hono";
import { verifyToken, verifyAdminToken } from "../utils/jwt";
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
      creatorId?: number;
    };

    // An admin token is signed with the same secret and would otherwise pass
    // here, setting creatorId to undefined and letting admin credentials act as
    // some ambiguous creator. Require the claim explicitly.
    if (typeof payload.creatorId !== "number") {
      return c.json(
        {
          success: false,
          message: "Invalid or expired token",
        },
        401
      );
    }

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

/**
 * Guards /admin/*.
 *
 * Verified against a key derived from ADMIN_PASSWORD, so rotating the password
 * revokes outstanding tokens. Creator tokens are signed with the bare secret and
 * carry no `role`, so they fail on both counts.
 */
export async function adminMiddleware(c: Context<AppEnv>, next: Next) {
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

  if (!c.env.ADMIN_PASSWORD) {
    return c.json(
      {
        success: false,
        message: "Admin access is not configured on the server",
      },
      503
    );
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = (await verifyAdminToken(token, c.env.ADMIN_PASSWORD)) as {
      role?: string;
    };

    if (payload.role !== "admin") {
      return c.json(
        {
          success: false,
          message: "Admin access required",
        },
        403
      );
    }

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