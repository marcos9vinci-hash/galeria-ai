import { z } from 'zod';

export const nicheSchema = z.object({
  userId: z.string().min(1, "Usuário inválido"),
  name: z.string().min(1, "Nome do nicho obrigatório"),
  description: z.string().optional(),
});
