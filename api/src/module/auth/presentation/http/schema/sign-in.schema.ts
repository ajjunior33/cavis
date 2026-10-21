import { z } from 'zod';
import { passwordSchema } from '../../../../../shared/pipes/zod-password-parser.pipe';

export const signInSchema = z.object({
  email: z.string(),
  password: passwordSchema,
});

export type SignInDTO = z.infer<typeof signInSchema>;
