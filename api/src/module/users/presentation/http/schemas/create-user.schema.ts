import { z } from 'zod';
import { passwordSchema } from '../../../../../shared/pipes/zod-password-parser.pipe';

export const createUserSchema = z.object({
  name: z.string(),
  email: z.email(),
  password: passwordSchema,
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;
