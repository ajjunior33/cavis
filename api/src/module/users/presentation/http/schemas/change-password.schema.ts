import { z } from 'zod';
import { passwordSchema } from '../../../../../shared/pipes/zod-password-parser.pipe';

export const changePasswordSchema = z
  .object(
    {
      current_password: z
        .string('A senha atual é obrigatória')
        .min(1, 'A senha atual é obrigatória'),
      new_password: passwordSchema,
    },
    {
      error: (issue) =>
        issue.code === 'unrecognized_keys'
          ? `Campo(s) não permitido(s): ${issue.keys.join(', ')}`
          : undefined,
    },
  )
  .strict()
  .refine((data) => data.new_password !== data.current_password, {
    path: ['new_password'],
    message: 'A nova senha deve ser diferente da senha atual',
  });

export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;
