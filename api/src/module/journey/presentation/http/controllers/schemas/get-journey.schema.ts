import { z } from 'zod';

export const getJourneySchema = z.object({
  check_ins_limit: z.coerce.number().int().min(1).max(30).default(7),
});

export type GetJourneyDTO = z.infer<typeof getJourneySchema>;
