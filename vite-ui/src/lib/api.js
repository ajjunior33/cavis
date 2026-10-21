import axios from 'axios'
import { WRONG_PASSWORD_MESSAGE } from '@/lib/api-error'
import { useAuthStore } from '@/stores/auth-store'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// "Senha atual incorreta" também é 401, mas não é sessão expirada: a requisição precisa
// pedir isso com `skipAuthRedirect: true` E a API precisa devolver exatamente essa mensagem.
// Assim, se o token expirar durante a troca de senha, o logout continua acontecendo.
function isWrongPasswordError(error) {
  return (
    error.config?.skipAuthRedirect === true &&
    error.response?.data?.message === WRONG_PASSWORD_MESSAGE
  )
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { token, logout } = useAuthStore.getState()

    // Só trata como sessão expirada se havia token; um 401 no login
    // (credenciais inválidas) deve chegar ao formulário sem redirecionar.
    if (error.response?.status === 401 && token && !isWrongPasswordError(error)) {
      logout()
      // Importar o router aqui criaria dependência circular com o main.jsx,
      // então usamos redirecionamento nativo (também limpa o cache do Query).
      window.location.replace('/login')
    }

    return Promise.reject(error)
  },
)
