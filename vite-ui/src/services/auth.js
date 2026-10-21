import { api } from '@/lib/api'

// ÚNICO lugar que conhece o formato da resposta de POST /auth.
// A API atual devolve: { user, access_token }.
// Se o back-end mudar (ex.: { token } ou { accessToken }), ajuste só aqui.
function parseSession(data) {
  const token = data?.access_token ?? data?.accessToken ?? data?.token
  const user = data?.user ?? null

  if (!token) {
    throw new Error('Resposta de autenticação sem token')
  }

  return { token, user }
}

// -> { token, user }, pronto para useAuthStore.setSession
export async function login({ email, password }) {
  const { data } = await api.post('/auth', { email, password })
  return parseSession(data)
}

// Não enviamos confirmPassword: a API não conhece esse campo.
export async function createUser({ name, email, password }) {
  const { data } = await api.post('/users', { name, email, password })
  return data
}
