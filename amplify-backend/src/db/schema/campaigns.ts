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

export const campaignStatusEnum = pgEnum("campaign_status", [
    "open",
    "full",
    "closed",
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

    status: campaignStatusEnum("status").default("open"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
});