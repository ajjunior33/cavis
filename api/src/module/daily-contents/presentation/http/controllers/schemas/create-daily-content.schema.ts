import { z } from 'zod';

export const createDailyContentSchema = z.object({
  title: z.string().min(1),
  reflection: z.string().min(1),
  practice: z.string().min(1),
  duration_min: z.number().int().positive().optional(),
  is_demo: z.boolean().optional(),
  mood_ids: z.array(z.uuid()).optional(),
});

export type CreateDailyContentDTO = z.infer<typeof createDailyContentSchema>;
