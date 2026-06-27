import {
  pgTable,
  serial,
  integer,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";

import { campaigns } from "./campaigns";
import { creators } from "./creators";

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "active",
  "completed",
  "rejected",
]);

export const enrollments = pgTable(
  "enrollments",
  {
    id: serial("id").primaryKey(),

    campaignId: integer("campaign_id")
      .references(() => campaigns.id, {
        onDelete: "cascade",
      })
      .notNull(),

    creatorId: integer("creator_id")
      .references(() => creators.id, {
        onDelete: "cascade",
      })
      .notNull(),

    enrolledAt: timestamp("enrolled_at")
      .defaultNow()
      .notNull(),

    status: enrollmentStatusEnum("status")
      .default("active")
      .notNull(),
  },
  (table) => ({
    uniqueEnrollment: unique().on(
      table.campaignId,
      table.creatorId
    ),
  })
);