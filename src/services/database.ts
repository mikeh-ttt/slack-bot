import { db, closeDb } from "../db/index";
import { nudges, jobs, managements } from "../db/schema";
import { eq, count, and, gte, sql } from "drizzle-orm";

export function initializeDatabase() {
  console.log("✅ Database initialized with Drizzle ORM");
}

export function recordNudge(userId: string, email?: string, name?: string) {
  db.insert(nudges)
    .values({
      userId,
      userEmail: email,
      userName: name,
      nudgedAt: new Date(),
    })
    .run();
}

export function getNudgeCount(userId: string): number {
  const result = db
    .select({ count: count() })
    .from(nudges)
    .where(eq(nudges.userId, userId))
    .get();

  return result?.count || 0;
}

export function getNudgeCountThisWeek(userId: string): number {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const result = db
    .select({ count: count() })
    .from(nudges)
    .where(and(eq(nudges.userId, userId), gte(nudges.nudgedAt, sevenDaysAgo)))
    .get();

  return result?.count || 0;
}

export function getNudgeCountToday(userId: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const result = db
    .select({ count: count() })
    .from(nudges)
    .where(
      and(
        eq(nudges.userId, userId),
        gte(nudges.nudgedAt, today),
        sql`${nudges.nudgedAt} < ${tomorrow}`
      )
    )
    .get();

  return result?.count || 0;
}

export function getAllNudges() {
  return db
    .select({
      userId: nudges.userId,
      userEmail: nudges.userEmail,
      userName: nudges.userName,
      count: count(),
    })
    .from(nudges)
    .groupBy(nudges.userId)
    .orderBy(sql`count(*) DESC`)
    .all();
}

// Job-related functions

export function addJob(
  name: string,
  schedule: string,
  description?: string,
  active: boolean = true
) {
  return db
    .insert(jobs)
    .values({
      name,
      description,
      schedule,
      active,
    })
    .run();
}

export function updateJob(
  id: number,
  name?: string,
  description?: string,
  schedule?: string,
  active?: boolean
) {
  const updates: Partial<{
    name: string;
    description: string;
    schedule: string;
    active: boolean;
  }> = {};
  if (name) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (schedule) updates.schedule = schedule;
  if (active !== undefined) updates.active = active;

  return db.update(jobs).set(updates).where(eq(jobs.id, id)).run();
}

export function deleteJob(id: number) {
  return db.delete(jobs).where(eq(jobs.id, id)).run();
}

export function getJobById(id: number) {
  return db.select().from(jobs).where(eq(jobs.id, id)).get();
}

export function getJobByName(name: string) {
  return db.select().from(jobs).where(eq(jobs.name, name)).get();
}

export function getAllJobs() {
  return db.select().from(jobs).all();
}

export function getActiveJobs() {
  return db.select().from(jobs).where(eq(jobs.active, true)).all();
}

// Management-related functions

export function addManagement(name: string, email: string) {
  return db
    .insert(managements)
    .values({
      name,
      email,
    })
    .run();
}

export function updateManagement(
  id: number,
  name?: string,
  email?: string
) {
  const updates: Partial<{ name: string; email: string }> = {};
  if (name) updates.name = name;
  if (email) updates.email = email;

  return db.update(managements).set(updates).where(eq(managements.id, id)).run();
}

export function deleteManagement(id: number) {
  return db.delete(managements).where(eq(managements.id, id)).run();
}

export function getManagementById(id: number) {
  return db.select().from(managements).where(eq(managements.id, id)).get();
}

export function getManagementByEmail(email: string) {
  return db.select().from(managements).where(eq(managements.email, email)).get();
}

export function getAllManagements() {
  return db.select().from(managements).all();
}

export function closeDatabase() {
  closeDb();
}
