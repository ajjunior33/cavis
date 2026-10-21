import { isAxiosError } from 'axios'

// Mensagem exata que a API devolve (401) quando a senha atual está errada na troca de senha.
export const WRONG_PASSWORD_MESSAGE = 'Senha atual incorreta'

// Padroniza a leitura de erros da API ({ statusCode, error, message, details? }).
// -> { status, message }. Sem resposta (rede/timeout): status null, message ''.
// `details` é técnico e nunca é exposto.
export function getApiError(error) {
  if (!isAxiosError(error) || !error.response) {
    return { status: null, message: '' }
  }

  const { status, data } = error.response
  const message = typeof data?.message === 'string' ? data.message : ''

  return { status, message }
}
