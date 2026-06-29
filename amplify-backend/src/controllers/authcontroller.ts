import { Context } from "hono";
import { registerSchema } from "../validators/auth-validator";
import { registerCreator } from "../services/auth-service";

export const register = async (c: Context) => {
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
    const response = await registerCreator(result.data);

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

export const login = async (c: Context) => {
  return c.json({
    message: "Login Controller",
  });
};