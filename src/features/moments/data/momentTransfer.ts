import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { z } from "zod";
import {
  backgroundValueSchema,
  reminderSchema,
  type BackgroundType,
  type Moment,
} from "../domain/moment";
import type { Category } from "@/features/categories/domain/category";
import type { MomentRepository, MomentInput } from "./momentRepository";
import type { CategoryRepository } from "@/features/categories/data/categoryRepository";
import {
  encodeMomentImageForExport,
  momentImageFileName,
  writeImportedImage,
} from "./imageFileService";

export type TransferFormat = "json" | "csv";

const EXPORT_VERSION = 1;

/** One category as it appears in an export file (ids are not portable). */
const exportCategorySchema = z.object({
  title: z.string().min(1),
  colorHex: z.string(),
});

/** One moment as it appears in an export file (without ids/timestamps). */
const exportMomentSchema = z.object({
  title: z.string().min(1),
  targetDateTime: z.string(),
  mode: z.enum(["since", "until"]),
  categoryTitle: z.string().nullable().default(null),
  backgroundType: z.enum(["solid", "gradient", "image"]),
  backgroundValue: backgroundValueSchema,
  /**
   * Image-background bytes embedded so the picture survives a transfer to a
   * device that doesn't have the original file. Downscaled JPEG, base64.
   */
  image: z
    .object({ data: z.string(), mime: z.string().default("image/jpeg") })
    .optional(),
  accentColor: z.string(),
  displayUnit: z.enum([
    "auto",
    "seconds",
    "minutes",
    "hours",
    "days",
    "weeks",
    "months",
    "years",
  ]),
  reminder: reminderSchema.nullable().default(null),
});

const exportFileSchema = z.object({
  app: z.literal("moment-tracker"),
  version: z.number(),
  exportedAt: z.string(),
  categories: z.array(exportCategorySchema).default([]),
  moments: z.array(exportMomentSchema).default([]),
});

type ExportMoment = z.infer<typeof exportMomentSchema>;

function titleById(categories: Category[]): Map<string, string> {
  return new Map(categories.map((c) => [c.id, c.title]));
}

async function toExportMoments(
  moments: Moment[],
  categories: Category[],
): Promise<ExportMoment[]> {
  const catTitle = titleById(categories);
  return Promise.all(
    moments.map(async (m) => {
      const bg = m.backgroundValue;
      let image: ExportMoment["image"];
      let backgroundValue = bg;
      if (bg.kind === "image") {
        // Embed the picture and store only the filename (absolute paths from
        // this device are meaningless on another one).
        const encoded = await encodeMomentImageForExport(bg.uri);
        if (encoded) image = encoded;
        backgroundValue = { ...bg, uri: momentImageFileName(bg.uri) };
      }
      return {
        title: m.title,
        targetDateTime: m.targetDateTime,
        mode: m.mode,
        categoryTitle: m.categoryId ? catTitle.get(m.categoryId) ?? null : null,
        backgroundType: m.backgroundType,
        backgroundValue,
        image,
        accentColor: m.accentColor,
        displayUnit: m.displayUnit,
        reminder: m.reminder,
      };
    }),
  );
}

async function buildJson(
  moments: Moment[],
  categories: Category[],
): Promise<string> {
  const usedCategoryTitles = new Set(
    moments
      .map((m) => (m.categoryId ? titleById(categories).get(m.categoryId) : null))
      .filter((t): t is string => Boolean(t)),
  );
  const payload = {
    app: "moment-tracker" as const,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    categories: categories
      .filter((c) => usedCategoryTitles.has(c.title))
      .map((c) => ({ title: c.title, colorHex: c.colorHex })),
    moments: await toExportMoments(moments, categories),
  };
  return JSON.stringify(payload, null, 2);
}

/** Escape a value for CSV (wrap in quotes, double inner quotes). */
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

const CSV_HEADER = [
  "title",
  "targetDateTime",
  "mode",
  "category",
  "displayUnit",
  "accentColor",
];

function buildCsv(moments: Moment[], categories: Category[]): string {
  const catTitle = titleById(categories);
  const rows = moments.map((m) =>
    [
      m.title,
      m.targetDateTime,
      m.mode,
      m.categoryId ? catTitle.get(m.categoryId) ?? "" : "",
      m.displayUnit,
      m.accentColor,
    ]
      .map((v) => csvCell(String(v)))
      .join(","),
  );
  return [CSV_HEADER.join(","), ...rows].join("\n");
}

/** Parse a CSV string (simple RFC-4180 subset with quoted cells). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

function csvToExportMoments(text: string): ExportMoment[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const out: ExportMoment[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const title = (r[idx("title")] ?? "").trim();
    const targetDateTime = (r[idx("targetDateTime")] ?? "").trim();
    if (!title || !targetDateTime) continue;
    const modeRaw = (r[idx("mode")] ?? "").trim();
    const mode = modeRaw === "until" ? "until" : "since";
    const accentColor = (r[idx("accentColor")] ?? "#0A84FF").trim() || "#0A84FF";
    const displayRaw = (r[idx("displayUnit")] ?? "auto").trim();
    const displayUnit = (
      [
        "auto",
        "seconds",
        "minutes",
        "hours",
        "days",
        "weeks",
        "months",
        "years",
      ] as const
    ).includes(displayRaw as never)
      ? (displayRaw as ExportMoment["displayUnit"])
      : "auto";
    const category = (r[idx("category")] ?? "").trim();
    out.push({
      title,
      targetDateTime,
      mode,
      categoryTitle: category || null,
      backgroundType: "solid",
      backgroundValue: { kind: "solid", color: accentColor },
      accentColor,
      displayUnit,
      reminder: null,
    });
  }
  return out;
}

function fileBase(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `moments-${stamp}`;
}

/**
 * Build the export file and hand it to the OS share sheet. Returns false if
 * sharing isn't available on the device.
 */
export async function exportMoments(
  moments: Moment[],
  categories: Category[],
  format: TransferFormat,
): Promise<{ shared: boolean; count: number }> {
  const content =
    format === "json"
      ? await buildJson(moments, categories)
      : buildCsv(moments, categories);
  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!dir) throw new Error("No writable directory available");
  const uri = `${dir}${fileBase()}.${format}`;
  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) return { shared: false, count: moments.length };
  await Sharing.shareAsync(uri, {
    mimeType: format === "json" ? "application/json" : "text/csv",
    dialogTitle: "Export moments",
    UTI: format === "json" ? "public.json" : "public.comma-separated-values-text",
  });
  return { shared: true, count: moments.length };
}

export type ImportResult =
  | { status: "cancelled" }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "ok"; imported: number };

/**
 * Let the user pick a .json/.csv file exported by this app and recreate the
 * moments (and any referenced categories) it contains.
 */
export async function importMoments(
  moments: MomentRepository,
  categories: CategoryRepository,
): Promise<ImportResult> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/csv", "text/comma-separated-values", "*/*"],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || !picked.assets?.length) {
    return { status: "cancelled" };
  }
  const asset = picked.assets[0];
  let text: string;
  try {
    text = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (e) {
    return { status: "error", message: `Could not read file: ${String(e)}` };
  }

  const isCsv =
    asset.name?.toLowerCase().endsWith(".csv") ||
    (!text.trimStart().startsWith("{") && !text.trimStart().startsWith("["));

  let entries: ExportMoment[];
  let exportCategories: { title: string; colorHex: string }[] = [];
  try {
    if (isCsv) {
      entries = csvToExportMoments(text);
    } else {
      const parsed = exportFileSchema.parse(JSON.parse(text));
      entries = parsed.moments;
      exportCategories = parsed.categories;
    }
  } catch (e) {
    return {
      status: "error",
      message: `File isn't a valid Moment Tracker export: ${String(e)}`,
    };
  }

  if (entries.length === 0) {
    return { status: "empty" };
  }

  // Resolve categories by title: reuse an existing one or create it.
  const existing = await categories.listAll();
  const byTitle = new Map<string, string>(
    existing.map((c) => [c.title.toLowerCase(), c.id]),
  );
  const colorForTitle = new Map(
    exportCategories.map((c) => [c.title.toLowerCase(), c.colorHex]),
  );

  async function resolveCategoryId(title: string | null): Promise<string | null> {
    if (!title) return null;
    const key = title.toLowerCase();
    const found = byTitle.get(key);
    if (found) return found;
    const created = await categories.create({
      title,
      colorHex: colorForTitle.get(key) ?? "#8E8E93",
    });
    byTitle.set(key, created.id);
    return created.id;
  }

  let imported = 0;
  for (const entry of entries) {
    const categoryId = await resolveCategoryId(entry.categoryTitle);

    // Recreate the image on this device from the embedded bytes and point the
    // moment at the freshly written local file.
    let backgroundValue = entry.backgroundValue;
    if (entry.image && entry.backgroundValue.kind === "image") {
      try {
        const name = await writeImportedImage(entry.image.data);
        backgroundValue = { ...entry.backgroundValue, uri: name };
      } catch {
        // Keep the moment even if the image can't be written; it just renders
        // without a background picture.
      }
    }

    const input: MomentInput = {
      title: entry.title,
      targetDateTime: entry.targetDateTime,
      mode: entry.mode,
      categoryId,
      backgroundType: entry.backgroundType as BackgroundType,
      backgroundValue,
      accentColor: entry.accentColor,
      displayUnit: entry.displayUnit,
      reminder: entry.reminder,
    };
    await moments.create(input);
    imported++;
  }

  return { status: "ok", imported };
}
