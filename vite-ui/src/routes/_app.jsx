import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useMatches,
  useNavigate,
} from '@tanstack/react-router'
import { LogOut, Search, Sun, SmilePlus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_app')({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: AppLayout,
})

const TABS = [
  { to: '/hoje', label: 'Hoje', icon: Sun },
  { to: '/checkin', label: 'Check-in', icon: SmilePlus },
  { to: '/buscar', label: 'Buscar', icon: Search },
  { to: '/perfil', label: 'Perfil', icon: User },
]

function AppLayout() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  // Cada rota pode definir `staticData: { title }`; o header usa o da rota ativa.
  const title = useMatches({
    select: (matches) => matches.findLast((match) => match.staticData?.title)?.staticData.title,
  })

  function handleLogout() {
    logout()
    // Dados do usuário não podem sobrar em memória para a próxima sessão
    queryClient.clear()
    navigate({ to: '/login' })
  }

  return (
    // Fora do mobile (>= md): fundo da página + "celular" centralizado de 480px
    <div className="min-h-dvh bg-muted md:flex md:justify-center">
      {/* h-dvh + coluna: header e tab bar nunca saem do lugar; só o <main> rola */}
      <div className="flex h-dvh w-full flex-col bg-surface md:max-w-120 md:border-x md:shadow-sm">
        <header className="shrink-0 border-b bg-surface pt-safe px-safe">
          <div className="flex h-14 items-center justify-between gap-2 px-4">
            <h1 className="truncate text-lg font-semibold">{title ?? 'Clavis'}</h1>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair">
              <LogOut aria-hidden="true" />
            </Button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-safe">
          <div className="p-4">
            <Outlet />
          </div>
        </main>

        <nav aria-label="Navegação principal" className="shrink-0 border-t bg-surface pb-safe px-safe">
          <ul className="grid grid-cols-4">
            {TABS.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                {/* O Link marca a rota ativa com data-status="active" e aria-current="page" */}
                <Link
                  to={to}
                  className="group flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-[status=active]:text-accent-foreground"
                >
                  <span className="flex h-7 w-14 items-center justify-center rounded-full group-data-[status=active]:bg-accent">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
