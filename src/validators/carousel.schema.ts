import { z } from 'zod';

export const carouselSlideSchema = z.object({
  postId: z.string().min(1, "Post inválido"),
  imageUrl: z.string().url("URL de imagem inválida"),
  order: z.number().int().min(0, "Ordem inválida"),
});
