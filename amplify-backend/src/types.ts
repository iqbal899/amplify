import type { Database } from "./db/client";

export type AppEnv = {
  Bindings: {
    DATABASE_URL: string;

    // Instagram API with Instagram Login. The secret is used server-side only —
    // the app never sees it, it only forwards the OAuth code here.
    INSTAGRAM_APP_ID: string;
    INSTAGRAM_APP_SECRET: string;

    // 32 bytes, base64. Encrypts creator access tokens at rest.
    TOKEN_ENCRYPTION_KEY: string;
  };
  Variables: {
    db: Database;
    creatorId: number; // set by auth middleware
  };
};