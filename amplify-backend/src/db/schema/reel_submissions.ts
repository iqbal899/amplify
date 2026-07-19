import {
  bigint,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { enrollments } from "./enrollments";

export const platformEnum = pgEnum("platform", [
  "instagram",
  "youtube",
]);

export const verificationEnum = pgEnum(
  "verification_status",
  ["pending", "verified", "rejected"]
);

export const reelSubmissions = pgTable(
  "reel_submissions",
  {
    id: serial("id").primaryKey(),

    enrollmentId: integer("enrollment_id")
      .references(() => enrollments.id, {
        onDelete: "cascade",
      })
      .notNull(),

    reelUrl: text("reel_url").notNull(),

    // Resolved once from reelUrl by matching the creator's own media. Insights
    // are addressed by media id, not URL — without this we cannot fetch views.
    instagramMediaId: text("instagram_media_id"),

    platform: platformEnum("platform").notNull(),

    submittedAt: timestamp("submitted_at")
      .defaultNow()
      .notNull(),

    // The reel's real publish time from Instagram. `submittedAt` is only when
    // they pasted the link, so milestone `minDaysLive` has no valid anchor
    // without this.
    wentLiveAt: timestamp("went_live_at"),

    currentViews: bigint("current_views", {
      mode: "number",
    })
      .default(0)
      .notNull(),

    lastCheckedAt: timestamp("last_checked_at"),

    verificationStatus: verificationEnum(
      "verification_status"
    )
      .default("pending")
      .notNull(),
  },
  (table) => ({
    uniqueSubmission: unique().on(table.enrollmentId),
  })
);