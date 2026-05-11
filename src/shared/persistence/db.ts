import * as SQLite from "expo-sqlite";
import { runMigrations } from "./migrations";
import { DEFAULT_CATEGORY_ID } from "@/features/categories/domain/category";

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function openAppDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  const db = await SQLite.openDatabaseAsync("moment_tracker.db");
  await runMigrations(db);
  await seedDefaultCategory(db);
  dbInstance = db;
  return db;
}

async function seedDefaultCategory(db: SQLite.SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM categories WHERE id = ?",
    [DEFAULT_CATEGORY_ID],
  );
  if (existing && existing.c > 0) return;

  await db.runAsync(
    `INSERT INTO categories (id, title, color_hex, sort_order, is_default)
     VALUES (?, ?, ?, ?, ?)`,
    [DEFAULT_CATEGORY_ID, "My Moments", "#8E8E93", 0, 1],
  );
}
