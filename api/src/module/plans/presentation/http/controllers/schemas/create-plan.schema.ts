import { z } from 'zod';
import { createPlanDaySchema } from './create-plan-day.schema';

export const createPlanSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'O slug deve estar no formato kebab-case.',
    ),
  title: z.string().min(1),
  description: z.string().min(1),
  total_days: z.number().int().positive(),
  is_demo: z.boolean().optional(),
  days: z.array(createPlanDaySchema).optional(),
});

export type CreatePlanDTO = z.infer<typeof createPlanSchema>;
