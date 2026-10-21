import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // Ao voltar para o app (ex.: depois de um check-in em outra aba), os dados são rebuscados
      refetchOnWindowFocus: true,
    },
  },
})
