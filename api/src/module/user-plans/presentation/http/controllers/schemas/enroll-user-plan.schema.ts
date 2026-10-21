import { z } from 'zod';

export const enrollUserPlanSchema = z.object({
  plan_id: z.uuid(),
});

export type EnrollUserPlanDTO = z.infer<typeof enrollUserPlanSchema>;
