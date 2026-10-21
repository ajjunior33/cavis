import { api } from '@/lib/api'

// ÚNICO lugar que conhece o formato de GET /today.
//
// Formato esperado pelo front (snake_case):
//   { check_in: { id, mood: { id, slug, label, emoji }, note, checked_at } | null,
//     content:  { id, title, reflection, practice, duration_min } | null }
//
// Formato REAL do back-end hoje (api/src/module/today):
//   200 -> { checkIn: { id, note, checkedAt, localDate, mood }, content: { ..., durationMin, isDemo } }
//   404 -> sem check-in hoje OU check-in sem conteúdo para o mood (o corpo não traz o check-in)
// Por isso: normalizamos camelCase/snake_case aqui e, no 404, consultamos GET /check-ins
// para separar "sem check-in" (estado B) de "sem conteúdo" (estado C).
// Se o back passar a devolver 200 com nulls, o fluxo do 200 já cobre.

const TIMEZONE = 'America/Sao_Paulo'

const EMPTY = { check_in: null, content: null }

// Mesma regra do back (CheckInsService.getTodayLocalDate): YYYY-MM-DD em America/Sao_Paulo
function getTodayLocalDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE })
}

function normalizeCheckIn(raw) {
  if (!raw) return null

  return {
    id: raw.id,
    mood: raw.mood,
    note: raw.note ?? null,
    checked_at: raw.checked_at ?? raw.checkedAt,
  }
}

function normalizeContent(raw) {
  if (!raw) return null

  return {
    id: raw.id,
    title: raw.title,
    reflection: raw.reflection,
    practice: raw.practice,
    duration_min: raw.duration_min ?? raw.durationMin ?? null,
  }
}

async function findLatestCheckInOfToday() {
  const { data } = await api.get('/check-ins')
  const list = Array.isArray(data) ? data : (data?.data ?? [])
  const today = getTodayLocalDate()

  // A API ordena do mais recente para o mais antigo
  const latest = list[0]

  return latest && (latest.localDate ?? latest.local_date) === today ? latest : null
}

export async function getToday() {
  try {
    const { data } = await api.get('/today')

    return {
      check_in: normalizeCheckIn(data?.check_in ?? data?.checkIn),
      content: normalizeContent(data?.content),
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      throw error
    }

    // 404 = sem check-in OU sem conteúdo. Se esta consulta falhar, o erro sobe
    // e a tela mostra "Tentar novamente" (melhor que mostrar o estado errado).
    const checkIn = await findLatestCheckInOfToday()

    return checkIn ? { ...EMPTY, check_in: normalizeCheckIn(checkIn) } : EMPTY
  }
}
