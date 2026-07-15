import type { Database } from "./db/client";

export type AppEnv = {
  Bindings: {
    DATABASE_URL: string;
  };
  Variables: {
    db: Database;
    creatorId: number; // set by auth middleware
  };
};