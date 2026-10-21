import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      // Derivado do token: não é persistido, então nunca fica dessincronizado.
      // Fora de componentes: useAuthStore.getState().isAuthenticated()
      isAuthenticated: () => Boolean(get().token),

      setSession: ({ token, user }) => set({ token, user }),

      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
)
