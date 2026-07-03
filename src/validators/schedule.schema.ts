import { z } from 'zod';

export const scheduleSchema = z.object({
  userId: z.string().min(1, "Usuário inválido"),
  preferredTimes: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)")),
  strategyNotes: z.string().optional(),
  objectiveQ2: z.string().optional(),
  objectiveQ3: z.string().optional(),
  objectiveQ4: z.string().optional(),
});
