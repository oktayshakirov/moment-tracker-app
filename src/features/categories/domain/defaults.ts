import type { DisplayUnit } from "@/features/moments/domain/moment";

/**
 * Built-in categories seeded on first launch (see migration v5). Ids are stable
 * so code can reference a specific default. Each carries a `defaultDisplayUnit`
 * that the moment form applies when the category is picked (e.g. Habits → a
 * day-streak counter, everything else → automatic). Users can still rename,
 * recolor, delete them, or override the unit per moment afterwards.
 */
export type DefaultCategory = {
  id: string;
  title: string;
  colorHex: string;
  sortOrder: number;
  defaultDisplayUnit: DisplayUnit;
};

export const DEFAULT_HABITS_CATEGORY_ID = "cat-default-habits";

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { id: DEFAULT_HABITS_CATEGORY_ID, title: "Habits", colorHex: "#34C759", sortOrder: 0, defaultDisplayUnit: "days" },
  { id: "cat-default-anniversaries", title: "Anniversaries", colorHex: "#FF375F", sortOrder: 1, defaultDisplayUnit: "auto" },
  { id: "cat-default-birthdays", title: "Birthdays", colorHex: "#FF9F0A", sortOrder: 2, defaultDisplayUnit: "auto" },
  { id: "cat-default-travel", title: "Travel", colorHex: "#30B0C7", sortOrder: 3, defaultDisplayUnit: "days" },
  { id: "cat-default-goals", title: "Goals", colorHex: "#5856D6", sortOrder: 4, defaultDisplayUnit: "days" },
  { id: "cat-default-work", title: "Work", colorHex: "#0A84FF", sortOrder: 5, defaultDisplayUnit: "auto" },
];

/**
 * The "Show as" unit to apply when a category is selected. Falls back to "auto"
 * for the None option and any user-created category.
 */
export function defaultDisplayUnitForCategory(
  categoryId: string | null,
): DisplayUnit {
  const match = DEFAULT_CATEGORIES.find((c) => c.id === categoryId);
  return match?.defaultDisplayUnit ?? "auto";
}
