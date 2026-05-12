import { z } from 'zod';

export const momentModeSchema = z.enum(['since', 'until']);
export type MomentMode = z.infer<typeof momentModeSchema>;

export const backgroundTypeSchema = z.enum(['solid', 'gradient', 'image']);
export type BackgroundType = z.infer<typeof backgroundTypeSchema>;

export const displayUnitSchema = z.enum([
  'auto',
  'seconds',
  'minutes',
  'hours',
  'days',
  'weeks',
  'months',
  'years',
]);
export type DisplayUnit = z.infer<typeof displayUnitSchema>;

const unsplashAttributionSchema = z.object({
  photographerName: z.string(),
  photographerHtmlUrl: z.string(),
  photoHtmlUrl: z.string(),
});

export const backgroundValueSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('solid'), color: z.string() }),
  z.object({
    kind: z.literal('gradient'),
    colors: z.array(z.string()).min(2),
    angle: z.number().optional(),
  }),
  z.object({
    kind: z.literal('image'),
    uri: z.string(),
    unsplashAttribution: unsplashAttributionSchema.optional(),
  }),
]);

export type BackgroundValue = z.infer<typeof backgroundValueSchema>;

export const momentSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  targetDateTime: z.string(),
  mode: momentModeSchema,
  categoryId: z.string(),
  backgroundType: backgroundTypeSchema,
  backgroundValue: backgroundValueSchema,
  displayUnit: displayUnitSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Moment = z.infer<typeof momentSchema>;
