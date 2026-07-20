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

/**
 * Admin tokens are signed with the admin password mixed into the key, so
 * changing ADMIN_PASSWORD invalidates every token already issued.
 *
 * Without this, rotating the password after a suspected leak would do nothing
 * for up to 12 hours — which is precisely the moment rotation is reached for.
 * There is no admin table, so this is the only revocation mechanism available.
 */
function adminSigningKey(adminPassword: string) {
  return `${JWT_SECRET}:${adminPassword}`;
}

/** Shorter-lived than a creator token: it is minted from a shared password. */
export async function generateAdminToken(adminPassword: string) {
  return await sign(
    {
      role: "admin",
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
    },
    adminSigningKey(adminPassword),
    "HS256"
  );
}

export async function verifyAdminToken(token: string, adminPassword: string) {
  return await verify(token, adminSigningKey(adminPassword), "HS256");
}

export async function verifyToken(token: string) {
  return await verify(
    token,
    JWT_SECRET,
    "HS256"
  );
}