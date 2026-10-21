import { z } from 'zod';

export const createPlanDaySchema = z.object({
  day_number: z.number().int().positive(),
  title: z.string().min(1),
  content: z.string().min(1),
  practice: z.string().min(1).optional(),
});

export type CreatePlanDayDTO = z.infer<typeof createPlanDaySchema>;
