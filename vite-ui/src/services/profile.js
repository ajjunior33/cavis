import { api } from '@/lib/api'

// -> { id, name, email, role, created_at, is_demo }
export async function getMe() {
  const { data } = await api.get('/users/me')
  return data
}

// A API usa schema strict: qualquer campo além de `name` resulta em 400.
// -> usuário atualizado (mesmo formato de getMe)
export async function updateName({ name }) {
  const { data } = await api.patch('/users/me', { name })
  return data
}

// Envia SOMENTE estes dois campos (sem confirm_password). Resposta 204, sem corpo.
// `skipAuthRedirect`: o 401 "Senha atual incorreta" não pode derrubar a sessão (ver lib/api.js).
export async function changePassword({ current_password, new_password }) {
  await api.patch(
    '/users/me/password',
    { current_password, new_password },
    { skipAuthRedirect: true },
  )
}
