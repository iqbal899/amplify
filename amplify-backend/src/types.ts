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

    // Single shared admin password for the internal panel. There is no admin
    // table, so payouts record what was done but not which person did it —
    // acceptable for one operator, revisit before there are several.
    ADMIN_PASSWORD: string;

    // Origin the admin panel is served from, for CORS. Comma-separated for
    // more than one. Only matters for direct browser access — the panel itself
    // calls this Worker server-side, so it never sends a preflight.
    ADMIN_ORIGIN?: string;
  };
  Variables: {
    db: Database;
    creatorId: number; // set by auth middleware
  };
};