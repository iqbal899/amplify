import {
    pgTable,
    serial,
    varchar,
    text,
    decimal,
    integer,
    timestamp,
    pgEnum,
    jsonb,
} from "drizzle-orm/pg-core";

// `draft` is authored-but-not-live: a campaign an admin is still writing.
// Appended rather than inserted so the migration is a plain ADD VALUE — nothing
// reads this enum ordinally. Creators never see drafts; the campaign list
// excludes them unless a status is explicitly requested.
export const campaignStatusEnum = pgEnum("campaign_status", [
    "open",
    "full",
    "closed",
    "draft",
]);

export const campaigns = pgTable("campaigns", {
    id: serial("id").primaryKey(),

    trackName: varchar("track_name", { length: 255 }).notNull(),

    artistName: varchar("artist_name", { length: 255 }).notNull(),

    spotifyTrackId: varchar("spotify_track_id", { length: 255 }),

    genre: varchar("genre", { length: 100 }),

    language: varchar("language", { length: 100 }),

    albumArt: text("album_art"),

    previewUrl: text("preview_url"),

    description: text("description"),

    rewardPool: decimal("reward_pool", {
        precision: 12,
        scale: 2,
    }),

    spotsTotal: integer("spots_total").notNull(),

    spotsFilled: integer("spots_filled").default(0),

    endsAt: timestamp("ends_at"),

    milestones: jsonb("milestones").$type<
        {
            views: number;
            minDaysLive: number;
            incrementalPayout: number;
            cumulativePayout: number;
        }[]
    >(),

    // NOT NULL matters for correctness, not just tidiness: `status <> 'draft'`
    // evaluates to NULL for a NULL row, so a nullable column would silently
    // hide any hand-inserted campaign from the creator-facing list.
    status: campaignStatusEnum("status").default("open").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
});