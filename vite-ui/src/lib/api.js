import axios from 'axios'
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { token, logout } = useAuthStore.getState()

    // Só trata como sessão expirada se havia token; um 401 no login
    // (credenciais inválidas) deve chegar ao formulário sem redirecionar.
    if (error.response?.status === 401 && token) {
      logout()
      // Importar o router aqui criaria dependência circular com o main.jsx,
      // então usamos redirecionamento nativo (também limpa o cache do Query).
      window.location.replace('/login')
    }

    return Promise.reject(error)
  },
)
