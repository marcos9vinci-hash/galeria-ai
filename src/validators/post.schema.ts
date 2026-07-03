import { z } from 'zod';

export const postSchema = z.object({
  userId: z.string().min(1, "Usuário inválido"),
  image: z.string().url("URL de imagem inválida"),
  caption: z.string().optional(),
  date: z.union([z.date(), z.string().min(1, "Data inválida")]),
  type: z.enum(['feed', 'carousel', 'reels', 'story']),
  status: z.enum(['draft', 'scheduled', 'posted', 'rascunho']),
  cta: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  title: z.string().optional(),
});
