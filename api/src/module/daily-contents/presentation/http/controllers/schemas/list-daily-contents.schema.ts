import { z } from 'zod';

export const listDailyContentsSchema = z.object({
  mood_id: z.uuid().optional(),
});

export type ListDailyContentsDTO = z.infer<typeof listDailyContentsSchema>;
