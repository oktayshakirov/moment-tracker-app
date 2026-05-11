import type * as SQLite from "expo-sqlite";
import {
  backgroundValueSchema,
  momentSchema,
  type BackgroundValue,
  type Moment,
  type MomentMode,
} from "../domain/moment";
import type { BackgroundType } from "../domain/moment";
import type { DisplayUnit } from "../domain/moment";
import { createId } from "@/shared/lib/ids";

type Row = {
  id: string;
  title: string;
  target_iso: string;
  mode: MomentMode;
  category_id: string;
  background_type: BackgroundType;
  background_json: string;
  display_unit: DisplayUnit;
  created_at: string;
  updated_at: string;
};

function mapRow(r: Row): Moment {
  const bg = backgroundValueSchema.parse(JSON.parse(r.background_json));
  return momentSchema.parse({
    id: r.id,
    title: r.title,
    targetDateTime: r.target_iso,
    mode: r.mode,
    categoryId: r.category_id,
    backgroundType: r.background_type,
    backgroundValue: bg,
    displayUnit: r.display_unit,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  });
}

export type MomentInput = {
  title: string;
  targetDateTime: string;
  mode: MomentMode;
  categoryId: string;
  backgroundType: BackgroundType;
  backgroundValue: BackgroundValue;
  displayUnit: DisplayUnit;
};

export class MomentRepository {
  constructor(private readonly db: SQLite.SQLiteDatabase) {}

  async listAll(): Promise<Moment[]> {
    const rows = await this.db.getAllAsync<Row>(
      "SELECT * FROM moments ORDER BY updated_at DESC",
    );
    return rows.map(mapRow);
  }

  async getById(id: string): Promise<Moment | null> {
    const r = await this.db.getFirstAsync<Row>(
      "SELECT * FROM moments WHERE id = ?",
      [id],
    );
    return r ? mapRow(r) : null;
  }

  async listByCategory(): Promise<Map<string, Moment[]>> {
    const moments = await this.listAll();
    const map = new Map<string, Moment[]>();
    for (const m of moments) {
      const list = map.get(m.categoryId) ?? [];
      list.push(m);
      map.set(m.categoryId, list);
    }
    return map;
  }

  async create(input: MomentInput): Promise<Moment> {
    const id = createId();
    const now = new Date().toISOString();
    await this.db.runAsync(
      `INSERT INTO moments (
        id, title, target_iso, mode, category_id, background_type, background_json,
        display_unit, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.title.trim(),
        input.targetDateTime,
        input.mode,
        input.categoryId,
        input.backgroundType,
        JSON.stringify(input.backgroundValue),
        input.displayUnit,
        now,
        now,
      ],
    );
    const m = await this.getById(id);
    if (!m) throw new Error("Failed to load new moment");
    return m;
  }

  async update(id: string, input: Partial<MomentInput>): Promise<void> {
    const cur = await this.getById(id);
    if (!cur) throw new Error("Moment not found");
    const next: MomentInput = {
      title: input.title ?? cur.title,
      targetDateTime: input.targetDateTime ?? cur.targetDateTime,
      mode: input.mode ?? cur.mode,
      categoryId: input.categoryId ?? cur.categoryId,
      backgroundType: input.backgroundType ?? cur.backgroundType,
      backgroundValue: input.backgroundValue ?? cur.backgroundValue,
      displayUnit: input.displayUnit ?? cur.displayUnit,
    };
    const now = new Date().toISOString();
    await this.db.runAsync(
      `UPDATE moments SET
        title = ?, target_iso = ?, mode = ?, category_id = ?, background_type = ?,
        background_json = ?, display_unit = ?, updated_at = ?
      WHERE id = ?`,
      [
        next.title.trim(),
        next.targetDateTime,
        next.mode,
        next.categoryId,
        next.backgroundType,
        JSON.stringify(next.backgroundValue),
        next.displayUnit,
        now,
        id,
      ],
    );
  }

  async resetStartTime(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      "UPDATE moments SET target_iso = ?, updated_at = ? WHERE id = ?",
      [now, now, id],
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.runAsync("DELETE FROM moments WHERE id = ?", [id]);
  }
}
