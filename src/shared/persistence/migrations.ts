import type * as SQLite from "expo-sqlite";
import { DEFAULT_CATEGORIES } from "@/features/categories/domain/defaults";

const CURRENT_VERSION = 5;

export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ version: number }>(
    "SELECT MAX(version) as version FROM schema_migrations",
  );
  let v = row?.version ?? 0;

  if (v < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        color_hex TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_default INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS moments (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        target_iso TEXT NOT NULL,
        mode TEXT NOT NULL CHECK (mode IN ('since', 'until')),
        category_id TEXT NOT NULL,
        background_type TEXT NOT NULL CHECK (background_type IN ('solid', 'gradient', 'image')),
        background_json TEXT NOT NULL,
        display_unit TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
      );

      CREATE INDEX IF NOT EXISTS idx_moments_category ON moments(category_id);
    `);
    await db.runAsync(
      "INSERT INTO schema_migrations (version) VALUES (?)",
      [1],
    );
    v = 1;
  }

  if (v < 2) {
    await db.execAsync(`
      ALTER TABLE moments ADD COLUMN accent_color TEXT NOT NULL DEFAULT '#2898CB';
    `);
    await db.execAsync(`
      UPDATE moments SET accent_color = CASE
        WHEN background_type = 'solid' THEN json_extract(background_json, '$.color')
        ELSE '#2898CB'
      END;
    `);
    await db.runAsync("INSERT INTO schema_migrations (version) VALUES (?)", [2]);
    v = 2;
  }

  if (v < 3) {
    // Recreate moments table with nullable category_id (SQLite can't drop constraints).
    // Also clean up the old "My Moments" default category and move its moments to NULL.
    await db.execAsync(`
      CREATE TABLE moments_v3 (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        target_iso TEXT NOT NULL,
        mode TEXT NOT NULL CHECK (mode IN ('since', 'until')),
        category_id TEXT,
        background_type TEXT NOT NULL CHECK (background_type IN ('solid', 'gradient', 'image')),
        background_json TEXT NOT NULL,
        accent_color TEXT NOT NULL DEFAULT '#2898CB',
        display_unit TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      );

      INSERT INTO moments_v3
        SELECT id, title, target_iso, mode,
               CASE WHEN category_id = 'cat-default-moments' THEN NULL ELSE category_id END,
               background_type, background_json, accent_color, display_unit, created_at, updated_at
        FROM moments;

      DROP TABLE moments;
      ALTER TABLE moments_v3 RENAME TO moments;

      CREATE INDEX IF NOT EXISTS idx_moments_category ON moments(category_id);

      DELETE FROM categories WHERE id = 'cat-default-moments';
    `);
    await db.runAsync("INSERT INTO schema_migrations (version) VALUES (?)", [3]);
    v = 3;
  }

  if (v < 4) {
    await db.execAsync(`
      ALTER TABLE moments ADD COLUMN reminder_json TEXT;
    `);
    await db.runAsync("INSERT INTO schema_migrations (version) VALUES (?)", [4]);
    v = 4;
  }

  if (v < 5) {
    // Seed built-in categories. INSERT OR IGNORE keeps it safe if a category
    // with the same stable id already exists.
    for (const c of DEFAULT_CATEGORIES) {
      await db.runAsync(
        `INSERT OR IGNORE INTO categories (id, title, color_hex, sort_order, is_default)
         VALUES (?, ?, ?, ?, 1)`,
        [c.id, c.title, c.colorHex, c.sortOrder],
      );
    }
    await db.runAsync("INSERT INTO schema_migrations (version) VALUES (?)", [5]);
    v = 5;
  }

  if (v !== CURRENT_VERSION) {
    console.warn(`Database at v${v}, app expects ${CURRENT_VERSION}`);
  }
}
