import { isAxiosError } from 'axios'

export const NETWORK_ERROR_MESSAGE = 'Não foi possível conectar. Tente novamente.'

// Classifica o erro para a UI sem expor nenhum detalhe técnico.
// -> 'invalid-credentials' | 'email-taken' | 'network'
export function classifyAuthError(error) {
  if (!isAxiosError(error) || !error.response) return 'network'

  const { status, data } = error.response

  if (status === 401) return 'invalid-credentials'
  if (status === 409) return 'email-taken'

  if (status === 400) {
    // A API devolve 400 "Usuário já existe." para e-mail duplicado no cadastro.
    const message = String(data?.message ?? '').toLowerCase()
    if (message.includes('já existe') || message.includes('ja existe')) return 'email-taken'
    return 'invalid-credentials'
  }

  return 'network'
}
