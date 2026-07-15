import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export function createDb(databaseUrl: string) {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1, // no cross-request pooling in Workers
  });
  return { db: drizzle(pool), pool };
}

export type Database = ReturnType<typeof createDb>["db"];