import { z } from 'zod';

export const createCheckInSchema = z.object({
  mood_id: z.uuid(),
  note: z.string().optional(),
});

export type CreateCheckInDTO = z.infer<typeof createCheckInSchema>;
