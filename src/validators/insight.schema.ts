import { z } from 'zod';

export const insightSchema = z.object({
  userId: z.string().min(1, "Usuário inválido"),
  metricName: z.string().min(1, "Métrica obrigatória"),
  value: z.number().min(0, "Valor inválido"),
  date: z.date(),
});
