import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronRight, CircleAlert, Loader2 } from 'lucide-react'
import { PlanProgress } from '@/components/plans/plan-progress'
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getPlans } from '@/services/plans'

export const Route = createFileRoute('/_app/planos/')({
  // O h1 da tela ("Planos") é o do header do layout _app, que usa este título
  staticData: { title: 'Planos' },
  component: PlanosPage,
})

function PlanosPage() {
  const query = useQuery({ queryKey: ['plans'], queryFn: getPlans })

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base text-muted-foreground">
        Caminhos curtos para você seguir no seu ritmo, um dia de cada vez.
      </p>

      <PlansContent query={query} />

      <p className="text-center text-sm text-muted-foreground">
        Planos de demonstração. Não substituem acompanhamento profissional.
      </p>
    </div>
  )
}

function PlansContent({ query }) {
  if (query.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Carregando os planos">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
      </div>
    )
  }

  // aria-live na região, para o leitor de tela anunciar o erro quando ele aparecer
  if (query.isError) {
    return (
      <div aria-live="polite">
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>Não foi possível carregar os planos</AlertDescription>
          <AlertAction className="static col-span-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={query.isFetching}
              onClick={() => query.refetch()}
            >
              {query.isFetching && <Loader2 className="animate-spin" aria-hidden="true" />}
              Tentar novamente
            </Button>
          </AlertAction>
        </Alert>
      </div>
    )
  }

  if (query.data.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-4 text-center text-base text-muted-foreground">
        Ainda não há planos disponíveis. Volte em breve.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-4">
      {query.data.map((plan) => (
        <li key={plan.id}>
          <PlanCard plan={plan} />
        </li>
      ))}
    </ul>
  )
}

function PlanCard({ plan }) {
  const { id, title, description, total_days: totalDays, completed_days: completedDays, started } = plan

  return (
    // O Link cobre o card inteiro; o título (h2) fica dentro dele
    <Link
      to="/planos/$planId"
      params={{ planId: id }}
      className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="gap-3 p-4 transition-colors hover:bg-muted">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </div>

        <p className="line-clamp-3 text-base whitespace-pre-line text-muted-foreground">{description}</p>

        <PlanProgress completedDays={completedDays} totalDays={totalDays} />

        {!started && <p className="text-base font-medium text-primary">Começar</p>}
      </Card>
    </Link>
  )
}
