import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

const sqlite = new Database("sqlite.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, {
  schema,
});

// Create tables if they don't exist
try {
  migrate(db, { migrationsFolder: "./drizzle" });
} catch (err) {
  // If migrations folder doesn't exist, create tables manually
  console.log("Creating tables manually...");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS nudges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      user_email TEXT,
      user_name TEXT,
      nudged_at INTEGER NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      schedule TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );
    
    CREATE TABLE IF NOT EXISTS managements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE
    );
  `);
}

export function closeDb() {
  sqlite.close();
}
