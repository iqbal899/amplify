import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { creators } from "../db/schema/creators";
import { generateToken } from "../utils/jwt";
import type { Database } from "../db/client";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};
type LoginInput = {
  email: string;
  password: string;
};

export async function registerCreator(db: Database, data: RegisterInput) {
  const [existingCreator] = await db
    .select()
    .from(creators)
    .where(eq(creators.email, data.email))
    .limit(1);

  if (existingCreator) {
    throw new Error("Email already exists");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const [creator] = await db
    .insert(creators)
    .values({
      name: data.name,
      email: data.email,
      passwordHash,
      phone: data.phone,
    })
    .returning();

  const token = await generateToken(creator.id);

  return {
    creator: sanitizeCreator(creator),
    token,
  };
}

export async function loginCreator(db: Database, data: LoginInput) {
  const [creator] = await db
    .select()
    .from(creators)
    .where(eq(creators.email, data.email))
    .limit(1);

  if (!creator) {
    throw new Error("Invalid email or password");
  }

  const validPassword = await bcrypt.compare(
    data.password,
    creator.passwordHash
  );

  if (!validPassword) {
    throw new Error("Invalid email or password");
  }

  const token = await generateToken(creator.id);

  return {
    creator: sanitizeCreator(creator),
    token,
  };
}

function sanitizeCreator(creator: typeof creators.$inferSelect) {
  const { passwordHash, ...safeCreator } = creator;
  return safeCreator;
}