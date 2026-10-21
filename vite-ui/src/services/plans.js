import { api } from '@/lib/api'

// ÚNICO lugar que conhece o formato dos endpoints de planos.
//
// Formato esperado pelo front (snake_case):
//   getPlans() -> [{ id, slug, title, description, total_days, completed_days, started }]
//   getPlan()  -> { id, slug, title, description, total_days, completed_days, started,
//                   days: [{ id, day_number, title, content, practice, completed, completed_at }] }
//
// Formato REAL do back-end hoje (api/src/module/plans e user-plans), diferente do contrato original:
//   GET  /plans                              -> [{ id, slug, title, description, totalDays, isDemo }]  (sem progresso)
//   GET  /plans/:slug                        -> { ...plan, days: [{ id, planId, dayNumber, title, content, practice }] }
//   GET  /user-plans                         -> [{ id, planId, startedAt, completedAt, plan, completedDays }]
//   GET  /user-plans/:id                     -> { ...userPlan, plan, completedDays, days: [{ ..., completedAt }] }
//   POST /user-plans  { plan_id }            -> inscreve (409 se já inscrito)
//   POST /user-plans/:id/days/:planDayId/complete -> { completedDays, completedAt, totalDays }  (idempotente)
// Por isso: o progresso vem de /user-plans (a inscrição é criada ao concluir o 1º dia),
// o front usa o id do PLANO na URL, e "day_number" é traduzido para o id do dia aqui dentro.
// Se o back passar a expor GET /plans/:id com progresso e POST /plans/:id/days/:n/complete,
// basta simplificar este arquivo: as telas não mudam.

const NOT_FOUND_MESSAGE = 'Plano não encontrado'

// Mesmo formato de erro do axios, para as telas tratarem tudo com isNotFoundError
function createNotFoundError() {
  return Object.assign(new Error(NOT_FOUND_MESSAGE), { response: { status: 404 } })
}

export function isNotFoundError(error) {
  return error?.response?.status === 404
}

function toArray(data) {
  return Array.isArray(data) ? data : (data?.data ?? [])
}

async function fetchPlans() {
  const { data } = await api.get('/plans')
  return toArray(data)
}

async function fetchUserPlans() {
  const { data } = await api.get('/user-plans')
  return toArray(data)
}

async function findUserPlan(planId) {
  const userPlans = await fetchUserPlans()
  return userPlans.find((userPlan) => userPlan.planId === planId) ?? null
}

function normalizeDay(day) {
  const completedAt = day.completedAt ?? null

  return {
    id: day.id,
    day_number: day.dayNumber,
    title: day.title,
    content: day.content,
    practice: day.practice ?? null,
    completed: completedAt !== null,
    completed_at: completedAt,
  }
}

function normalizePlan(plan, { completedDays = 0, started = false, days = [] } = {}) {
  return {
    id: plan.id,
    slug: plan.slug,
    title: plan.title,
    description: plan.description,
    total_days: plan.totalDays,
    completed_days: completedDays,
    started,
    days: days.map(normalizeDay).sort((a, b) => a.day_number - b.day_number),
  }
}

// Detalhe de uma inscrição (GET /user-plans/:id): já traz plano, dias e conclusões
async function fetchUserPlanDetail(userPlanId) {
  const { data } = await api.get(`/user-plans/${userPlanId}`)

  return normalizePlan(data.plan, {
    completedDays: data.completedDays,
    started: true,
    days: data.days ?? [],
  })
}

export async function getPlans() {
  const [plans, userPlans] = await Promise.all([fetchPlans(), fetchUserPlans()])
  const userPlanByPlanId = new Map(userPlans.map((userPlan) => [userPlan.planId, userPlan]))

  return plans.map((plan) => {
    const userPlan = userPlanByPlanId.get(plan.id)

    return {
      id: plan.id,
      slug: plan.slug,
      title: plan.title,
      description: plan.description,
      total_days: plan.totalDays,
      completed_days: userPlan?.completedDays ?? 0,
      started: Boolean(userPlan),
    }
  })
}

export async function getPlan(id) {
  const userPlan = await findUserPlan(id)

  if (userPlan) {
    return fetchUserPlanDetail(userPlan.id)
  }

  // Ainda não iniciado: GET /plans/:slug devolve os dias, e o slug vem da lista
  const plan = (await fetchPlans()).find((item) => item.id === id)

  if (!plan) {
    throw createNotFoundError()
  }

  const { data } = await api.get(`/plans/${plan.slug}`)

  return normalizePlan(plan, { days: data.days ?? [] })
}

// Cria a inscrição se ainda não existir. Dois toques simultâneos podem competir:
// o 409 do back significa "já inscrito", então só buscamos a inscrição existente.
async function ensureUserPlan(planId) {
  const existing = await findUserPlan(planId)

  if (existing) {
    return existing
  }

  try {
    const { data } = await api.post('/user-plans', { plan_id: planId })
    return data
  } catch (error) {
    if (error.response?.status !== 409) {
      throw error
    }

    const enrolled = await findUserPlan(planId)

    if (!enrolled) {
      throw error
    }

    return enrolled
  }
}

// Conclui o dia e devolve o plano atualizado (fonte de verdade = o que o back gravou).
// Idempotente: concluir o mesmo dia duas vezes não é erro.
export async function completePlanDay({ planId, dayNumber }) {
  const userPlan = await ensureUserPlan(planId)
  const current = await fetchUserPlanDetail(userPlan.id)
  const day = current.days.find((item) => item.day_number === dayNumber)

  if (!day) {
    throw createNotFoundError()
  }

  try {
    await api.post(`/user-plans/${userPlan.id}/days/${day.id}/complete`)
  } catch (error) {
    // Se um dia já concluído voltar 409, é sucesso: o estado abaixo reflete o banco
    if (error.response?.status !== 409) {
      throw error
    }
  }

  return fetchUserPlanDetail(userPlan.id)
}
