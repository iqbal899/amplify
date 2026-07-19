import {
  pgTable,
  serial,
  integer,
  bigint,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

import { reelSubmissions } from "./reel_submissions";

/**
 * Where a snapshot came from.
 *
 * `settlement` is the one that matters for money: it is the reading taken when
 * a campaign closed, and payouts are computed from it.
 */
export const snapshotSourceEnum = pgEnum("snapshot_source", [
  "poll",
  "settlement",
  "manual",
]);

/**
 * Append-only history of view counts.
 *
 * A single mutable `currentViews` column cannot answer "how many views did this
 * reel have when the campaign ended?" once it has been overwritten. It also
 * hides the case where Instagram retroactively removes views — which is exactly
 * what happens to purchased ones. So every reading is kept.
 */
export const viewSnapshots = pgTable(
  "view_snapshots",
  {
    id: serial("id").primaryKey(),

    submissionId: integer("submission_id")
      .notNull()
      .references(() => reelSubmissions.id, { onDelete: "cascade" }),

    views: bigint("views", { mode: "number" }).notNull(),

    reach: bigint("reach", { mode: "number" }),

    capturedAt: timestamp("captured_at").defaultNow().notNull(),

    source: snapshotSourceEnum("source").default("poll").notNull(),
  },
  (table) => [
    // Settlement reads "latest snapshot for this submission at or before X".
    index("view_snapshots_submission_captured_idx").on(
      table.submissionId,
      table.capturedAt
    ),
  ]
);
