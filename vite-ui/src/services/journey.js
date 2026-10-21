import { api } from '@/lib/api'

// ÚNICO lugar que conhece o formato de GET /journey.
//
// Formato esperado pelo front (snake_case):
//   { check_ins: [{ id, checked_at, note, mood: { id, slug, label, emoji } }],   // mais recentes primeiro
//     plans:     [{ id, title, total_days, completed_days, last_completed_at }] } // só planos iniciados
//
// Formato REAL do back-end hoje (api/src/module/journey), diferente do contrato original:
//   GET /journey?check_ins_limit=N (1..30, padrão 7)
//     -> { recentCheckIns: [{ id, note, checkedAt, localDate, mood }],
//          plans: [{ id (da inscrição), startedAt, completedAt,
//                    plan: { id, slug, title }, totalDays, completedDays, percent }] }
// Por isso: traduzimos camelCase -> snake_case aqui, pedimos 10 check-ins explicitamente
// e usamos o id do PLANO (plan.id) como `id`, porque /planos/:id da tela usa o id do plano.
// A API ainda não devolve a data da última conclusão: `last_completed_at` fica null
// (a tela não depende dele). Se o back passar a expor, basta mapear aqui.

const CHECK_INS_LIMIT = 10

function toArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeCheckIn(raw) {
  return {
    id: raw.id,
    checked_at: raw.checked_at ?? raw.checkedAt,
    note: raw.note ?? null,
    mood: raw.mood,
  }
}

function normalizePlan(raw) {
  // Aceita o formato real (inscrição + plan aninhado) e o contrato original (plano "achatado")
  const plan = raw.plan ?? raw

  return {
    id: plan.id,
    title: plan.title,
    total_days: raw.total_days ?? raw.totalDays ?? 0,
    completed_days: raw.completed_days ?? raw.completedDays ?? 0,
    last_completed_at: raw.last_completed_at ?? raw.lastCompletedAt ?? null,
  }
}

export async function getJourney() {
  const { data } = await api.get('/journey', { params: { check_ins_limit: CHECK_INS_LIMIT } })

  const checkIns = toArray(data?.check_ins ?? data?.recentCheckIns)
    .map(normalizeCheckIn)
    // A API já ordena, mas a tela promete "mais recentes primeiro": garantimos aqui
    .sort((a, b) => new Date(b.checked_at) - new Date(a.checked_at))

  return {
    check_ins: checkIns,
    plans: toArray(data?.plans).map(normalizePlan),
  }
}
