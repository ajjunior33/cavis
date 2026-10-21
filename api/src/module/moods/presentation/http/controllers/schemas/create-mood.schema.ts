import { z } from 'zod';

export const createMoodSchema = z.object({
  label: z.string(),
  emoji: z.string().optional(),
  soft_order: z.number().optional(),
});

export type CreateMoodDTO = z.infer<typeof createMoodSchema>;
