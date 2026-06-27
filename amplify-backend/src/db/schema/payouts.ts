import {
  pgTable,
  serial,
  integer,
  decimal,
  varchar,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";

import { creators } from "./creators";
import { reelSubmissions } from "./reel_submissions";

//IMPORTANT:
//Payout is designed to pay the rewatrd at the end of the campaign after the verification of the achieved milestone.

export const payoutStatusEnum = pgEnum("payout_status", [
  "pending",
  "paid",
  "failed",
]);

export const payouts = pgTable(
  "payouts",
  {
    id: serial("id").primaryKey(),

    creatorId: integer("creator_id")
      .references(() => creators.id, {
        onDelete: "cascade",
      })
      .notNull(),

    submissionId: integer("submission_id")
      .references(() => reelSubmissions.id, {
        onDelete: "cascade",
      })
      .notNull(),

    amount: decimal("amount", {
      precision: 10,
      scale: 2,
    }).notNull(),

    upiReference: varchar("upi_reference", {
      length: 100,
    }),

    status: payoutStatusEnum("status")
      .default("pending")
      .notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    paidAt: timestamp("paid_at"),
  },
  (table) => ({
    uniqueSubmissionPayout: unique().on(table.submissionId),
  })
);