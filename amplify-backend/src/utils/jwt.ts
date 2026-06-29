import { sign, verify } from "hono/jwt";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function generateToken(creatorId: number) {
  return await sign(
    {
      creatorId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    },
    JWT_SECRET,
    "HS256"
  );
}

export async function verifyToken(token: string) {
  return await verify(
    token,
    JWT_SECRET,
    "HS256"
  );
}