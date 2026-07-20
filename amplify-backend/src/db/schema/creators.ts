import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const creators = pgTable("creators", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 100 }).notNull(),

  email: varchar("email", { length: 255 })
    .notNull()
    .unique(),

  passwordHash: text("password_hash").notNull(),

  phone: varchar("phone", { length: 20 }),

  // Where a payout is actually sent. Entered by an admin, not by the creator —
  // payouts.upiReference is the reference of a transfer already made, which is
  // no use when you are trying to work out who to send money to.
  upiId: varchar("upi_id", { length: 255 }),

  instagramUsername: varchar("instagram_username", { length: 100 }),

  instagramUserId: varchar("instagram_user_id", { length: 255 }),

  // AES-GCM encrypted long-lived token. Never returned to the client.
  instagramAccessToken: text("instagram_access_token"),

  // Long-lived tokens last 60 days; past this the connection is blind and the
  // creator has to reconnect before we can read any more view counts.
  instagramTokenExpiresAt: timestamp("instagram_token_expires_at"),

  // BUSINESS | MEDIA_CREATOR. Personal accounts expose no insights, so this
  // gates campaign enrollment.
  instagramAccountType: varchar("instagram_account_type", { length: 32 }),

  instagramConnectedAt: timestamp("instagram_connected_at"),

  profileImage: text("profile_image"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});