// import { createMiddleware } from "hono/factory";

// import { createDb } from "../db/client";

// export const dbMiddleware = createMiddleware(
//   async (c, next) => {
//     const { db, pool } = createDb(
//       c.env.DATABASE_URL
//     );

//     c.set("db", db);

//     try {
//       await next();
//     } finally {
//       // Always close the connection
//       c.executionCtx.waitUntil(pool.end());
//     }
//   }
// );

import { createMiddleware } from "hono/factory";
import { createDb } from "../db/client";
import type { AppEnv } from "../types";

export const dbMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const { db, pool } = createDb(c.env.DATABASE_URL);
  c.set("db", db);

  await next();

  c.executionCtx.waitUntil(pool.end());
});