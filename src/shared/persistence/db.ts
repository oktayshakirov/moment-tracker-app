import * as SQLite from "expo-sqlite";
import { runMigrations } from "./migrations";

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function openAppDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  const db = await SQLite.openDatabaseAsync("moment_tracker.db");
  await runMigrations(db);
  dbInstance = db;
  return db;
}
