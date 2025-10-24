import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const nudges = sqliteTable("nudges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  userEmail: text("user_email"),
  userName: text("user_name"),
  nudgedAt: integer("nudged_at", { mode: "timestamp" }).notNull(),
});

export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  schedule: text("schedule").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const managements = sqliteTable("managements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
});

export type Nudge = typeof nudges.$inferSelect;
export type NewNudge = typeof nudges.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type Management = typeof managements.$inferSelect;
export type NewManagement = typeof managements.$inferInsert;
