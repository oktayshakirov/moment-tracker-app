import type * as SQLite from "expo-sqlite";
import {
  categorySchema,
  DEFAULT_CATEGORY_ID,
  type Category,
} from "../domain/category";
import { createId } from "@/shared/lib/ids";

type Row = {
  id: string;
  title: string;
  color_hex: string;
  sort_order: number;
  is_default: number;
};

function mapRow(r: Row): Category {
  return categorySchema.parse({
    id: r.id,
    title: r.title,
    colorHex: r.color_hex,
    sortOrder: r.sort_order,
    isDefault: r.is_default === 1,
  });
}

export class CategoryRepository {
  constructor(private readonly db: SQLite.SQLiteDatabase) {}

  async listAll(): Promise<Category[]> {
    const rows = await this.db.getAllAsync<Row>(
      "SELECT * FROM categories ORDER BY sort_order ASC, title ASC",
    );
    return rows.map(mapRow);
  }

  async getById(id: string): Promise<Category | null> {
    const r = await this.db.getFirstAsync<Row>(
      "SELECT * FROM categories WHERE id = ?",
      [id],
    );
    return r ? mapRow(r) : null;
  }

  async create(input: { title: string; colorHex: string }): Promise<Category> {
    const id = createId();
    const sort = Date.now();
    await this.db.runAsync(
      `INSERT INTO categories (id, title, color_hex, sort_order, is_default) VALUES (?, ?, ?, ?, 0)`,
      [id, input.title.trim(), input.colorHex, sort],
    );
    const c = await this.getById(id);
    if (!c) throw new Error("Failed to load new category");
    return c;
  }

  async update(
    id: string,
    input: { title?: string; colorHex?: string },
  ): Promise<void> {
    const cur = await this.getById(id);
    if (!cur) throw new Error("Category not found");
    const title = input.title?.trim() ?? cur.title;
    const color = input.colorHex ?? cur.colorHex;
    await this.db.runAsync(
      "UPDATE categories SET title = ?, color_hex = ? WHERE id = ?",
      [title, color, id],
    );
  }

  async delete(id: string): Promise<void> {
    if (id === DEFAULT_CATEGORY_ID) return;
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        "UPDATE moments SET category_id = ? WHERE category_id = ?",
        [DEFAULT_CATEGORY_ID, id],
      );
      await this.db.runAsync("DELETE FROM categories WHERE id = ?", [id]);
    });
  }
}
