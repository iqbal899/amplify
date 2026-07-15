import { Context } from "hono";

import {
  registerSchema,
  loginSchema,
} from "../validators/auth-validator";

import {
  registerCreator,
  loginCreator,
} from "../services/auth-service";

import type { AppEnv } from "../types";

export const register = async (c: Context<AppEnv>) => {
  const db = c.get("db"); // ← new line

  const body = await c.req.json();

  const result = registerSchema.safeParse(body);

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
    const response = await registerCreator(db, result.data); // ← pass db in

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
      400
    );
  }
};

export const login = async (c: Context<AppEnv>) => {
  const db = c.get("db"); // ← new line

  const body = await c.req.json();

  const result = loginSchema.safeParse(body);

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
    const response = await loginCreator(db, result.data); // ← pass db in

    return c.json(
      {
        success: true,
        ...response,
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
            : "Internal Server Error",
      },
      401
    );
  }
};