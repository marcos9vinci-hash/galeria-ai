import { z } from "zod";

// ─── Post ───────────────────────────────────────────────────
export const PostEditorSettingsSchema = z.object({
  brightness: z.number().min(0).max(200).default(100),
  contrast: z.number().min(0).max(200).default(100),
  saturate: z.number().min(0).max(200).default(100),
  rotate: z.number().min(-360).max(360).default(0),
  scaleX: z.number().min(-1).max(1).default(1),
  scaleY: z.number().min(-1).max(1).default(1),
});

export const PostTypeSchema = z.enum(["feed", "reel", "story", "carousel"]);
export const PostStatusSchema = z.enum(["rascunho", "pronto", "agendado", "publicado"]);

export const PostSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  image: z.string().url("URL de imagem inválida"),
  caption: z.string().max(2200, "Legenda não pode exceder 2200 caracteres").optional().default(""),
  hashtags: z.array(z.string().regex(/^#\w+$/, "Hashtag inválida")).default([]),
  cta: z.string().max(150, "CTA não pode exceder 150 caracteres").optional().default(""),
  type: PostTypeSchema.default("feed"),
  status: PostStatusSchema.default("rascunho"),
  date: z.union([z.string(), z.date()]),
  scheduledTime: z.union([z.string(), z.date()]).optional(),
  scheduledDate: z.string().optional(),
  scheduledAt: z.union([z.string(), z.date()]).optional(),
  editorSettings: PostEditorSettingsSchema.default(() => ({})),
  aiReasoning: z.string().optional(),
});

export type Post = z.infer<typeof PostSchema>;
export type PostEditorSettings = z.infer<typeof PostEditorSettingsSchema>;

// ─── Niche ──────────────────────────────────────────────────
export const NicheSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome do nicho é obrigatório"),
  hashtags: z.array(z.string()).min(1, "Adicione pelo menos 1 hashtag").default([]),
  competitors: z.array(z.string()).default([]),
  color: z.string().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
});

export type Niche = z.infer<typeof NicheSchema>;

// ─── Carousel ───────────────────────────────────────────────
export const CarouselSlideSchema = z.object({
  id: z.string().optional(),
  image: z.string().url(),
  caption: z.string().max(500).optional().default(""),
  order: z.number().int().min(0).default(0),
});

export const CarouselSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(100),
  slides: z.array(CarouselSlideSchema).min(2, "Carousel precisa de pelo menos 2 slides").max(10),
  status: PostStatusSchema,
  scheduledAt: z.union([z.string(), z.date()]).optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
});

export type CarouselSlide = z.infer<typeof CarouselSlideSchema>;
export type Carousel = z.infer<typeof CarouselSchema>;

// ─── Schedule ───────────────────────────────────────────────
export const ScheduleConfigSchema = z.object({
  id: z.string().optional(),
  postId: z.union([z.string(), z.number()]),
  targetTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  platform: z.enum(["instagram", "buffer"]).default("instagram"),
});

export type ScheduleConfig = z.infer<typeof ScheduleConfigSchema>;

// ─── Insight ────────────────────────────────────────────────
export const InsightSchema = z.object({
  id: z.string().optional(),
  metric: z.string().min(1),
  value: z.number(),
  unit: z.string().optional().default(""),
  period: z.string().optional(),
  igId: z.string().optional(),
  createdAt: z.union([z.string(), z.date()]).default(() => new Date().toISOString()),
});

export type Insight = z.infer<typeof InsightSchema>;

// ─── Validate helpers ──────────────────────────────────────
export function validatePost(data: unknown) {
  return PostSchema.safeParse(data);
}

export function validateNiche(data: unknown) {
  return NicheSchema.safeParse(data);
}

export function validateSchedule(data: unknown) {
  return ScheduleConfigSchema.safeParse(data);
}

export function validateCarousel(data: unknown) {
  return CarouselSchema.safeParse(data);
}

export function validateInsight(data: unknown) {
  return InsightSchema.safeParse(data);
}