import { z } from 'zod'

// Requisitos de senha em um único lugar: o schema valida e o checklist da UI exibe.
export const PASSWORD_RULES = [
  { id: 'length', label: 'Pelo menos 8 caracteres', test: (value) => value.length >= 8 },
  { id: 'lower', label: 'Uma letra minúscula', test: (value) => /[a-z]/.test(value) },
  { id: 'upper', label: 'Uma letra maiúscula', test: (value) => /[A-Z]/.test(value) },
  { id: 'number', label: 'Um número', test: (value) => /\d/.test(value) },
]

export const passwordSchema = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres')
  .regex(/[a-z]/, 'Inclua pelo menos uma letra minúscula')
  .regex(/[A-Z]/, 'Inclua pelo menos uma letra maiúscula')
  .regex(/\d/, 'Inclua pelo menos um número')

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail')
  .pipe(z.email('Esse e-mail não parece válido'))

// No login não aplicamos regras de força: só exigimos que a senha tenha sido preenchida.
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe sua senha'),
})

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, 'Como podemos te chamar? Use pelo menos 2 letras'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.confirmPassword === data.password, {
    path: ['confirmPassword'],
    message: 'As senhas não são iguais',
  })
