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

  instagramUsername: varchar("instagram_username", { length: 100 }),

  instagramUserId: varchar("instagram_user_id", { length: 255 }),

  profileImage: text("profile_image"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});