import { z } from 'zod'
import { passwordSchema } from '@/schemas/auth'

export const updateNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Use pelo menos 2 letras')
    .max(80, 'O nome pode ter no máximo 80 caracteres'),
})

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Informe sua senha atual'),
    new_password: passwordSchema,
    confirm_password: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((data) => data.confirm_password === data.new_password, {
    path: ['confirm_password'],
    message: 'As senhas não são iguais',
  })
  .refine((data) => data.new_password !== data.current_password, {
    path: ['new_password'],
    message: 'A nova senha precisa ser diferente da atual',
  })

// A API não conhece confirm_password (strict): descartamos antes de enviar.
export function toChangePasswordPayload({ current_password, new_password }) {
  return { current_password, new_password }
}
