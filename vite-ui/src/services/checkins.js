import { api } from '@/lib/api'

// ÚNICO lugar que conhece o formato de GET /moods e POST /check-ins.
// Formato confirmado no back-end (api/src/module/moods e check-ins):
//   GET  /moods      -> [{ id, slug, label, emoji }]  (emoji pode ser null)
//   POST /check-ins  -> body { mood_id, note? }; a API define a local_date.
// Se a API mudar (ex.: lista embrulhada em { data }), ajuste só aqui.
export async function getMoods() {
  const { data } = await api.get('/moods')
  return Array.isArray(data) ? data : (data?.data ?? [])
}

// Nunca enviamos data. Nota vazia é omitida do body.
export async function createCheckIn({ mood_id, note }) {
  const body = { mood_id }

  if (note) {
    body.note = note
  }

  const { data } = await api.post('/check-ins', body)
  return data
}
