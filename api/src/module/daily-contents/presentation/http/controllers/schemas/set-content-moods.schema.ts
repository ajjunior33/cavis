import { z } from 'zod';

export const setContentMoodsSchema = z.object({
  mood_ids: z.array(z.uuid()),
});

export type SetContentMoodsDTO = z.infer<typeof setContentMoodsSchema>;
