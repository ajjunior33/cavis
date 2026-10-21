import { z } from 'zod';

export const updateMeSchema = z
  .object(
    {
      name: z
        .string('O nome é obrigatório')
        .trim()
        .min(2, 'O nome deve ter no mínimo 2 caracteres')
        .max(80, 'O nome deve ter no máximo 80 caracteres'),
    },
    {
      // .strict(): impede enviar email, role, isDemo, id, deletedAt etc.
      error: (issue) =>
        issue.code === 'unrecognized_keys'
          ? `Campo(s) não permitido(s): ${issue.keys.join(', ')}`
          : undefined,
    },
  )
  .strict();

export type UpdateMeDTO = z.infer<typeof updateMeSchema>;
