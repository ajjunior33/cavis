import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppLogo } from '@/components/app-logo'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated()) {
      throw redirect({ to: '/home' })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-linear-to-br from-pastel-blue via-pastel-lavender to-pastel-pink px-safe pt-safe pb-safe">
      <main className="flex w-full max-w-105 flex-col gap-6 px-4 py-8">
        <AppLogo />
        <Card>
          <CardContent>
            <Outlet />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
