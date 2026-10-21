import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número');

export type Password = z.infer<typeof passwordSchema>;
