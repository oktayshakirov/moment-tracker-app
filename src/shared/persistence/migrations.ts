import type * as SQLite from "expo-sqlite";

const CURRENT_VERSION = 1;

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

  if (v !== CURRENT_VERSION) {
    console.warn(`Database at v${v}, app expects ${CURRENT_VERSION}`);
  }
}
