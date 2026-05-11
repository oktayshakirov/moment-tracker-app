import { z } from "zod";

export const DEFAULT_CATEGORY_ID = "cat-default-moments";

export const categorySchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  sortOrder: z.number().int(),
  isDefault: z.boolean(),
});

export type Category = z.infer<typeof categorySchema>;
