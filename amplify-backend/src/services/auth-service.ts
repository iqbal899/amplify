import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { creators } from "../db/schema/creators";
import { generateToken } from "../utils/jwt";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};

export async function registerCreator(data: RegisterInput) {
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

  const token = generateToken(creator.id);

  return {
    creator,
    token,
  };
}