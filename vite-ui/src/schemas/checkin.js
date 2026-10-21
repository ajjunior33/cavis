import { z } from 'zod'

export const NOTE_MAX_LENGTH = 280

// Espelha createCheckInSchema da API ({ mood_id: uuid, note?: string }).
// A data NÃO faz parte do schema: o back-end define a local_date.
export const createCheckInSchema = z.object({
  mood_id: z.uuid('Escolha como você está se sentindo'),
  note: z
    .string()
    .trim()
    .max(NOTE_MAX_LENGTH, `A nota pode ter até ${NOTE_MAX_LENGTH} caracteres`)
    // Nota vazia vira undefined: o campo é omitido do body
    .transform((value) => (value === '' ? undefined : value))
    .optional(),
})
