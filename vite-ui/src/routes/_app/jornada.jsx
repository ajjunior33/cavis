import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CircleAlert, CircleCheck, ChevronRight, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { PlanProgress } from '@/components/plans/plan-progress'
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeDay, formatTime } from '@/lib/date'
import { getJourney } from '@/services/journey'

export const Route = createFileRoute('/_app/jornada')({
  // O h1 da tela ("Minha jornada") é o do header do layout _app, que usa este título
  staticData: { title: 'Minha jornada' },
  component: JornadaPage,
})

function JornadaPage() {
  // Os dados vêm só da API. As mutations de check-in e de conclusão de dia invalidam
  // ['journey'], e o refetchOnWindowFocus padrão cobre o retorno ao app.
  const query = useQuery({ queryKey: ['journey'], queryFn: getJourney })

  return (
    <div className="flex flex-col gap-6">
      <p className="text-base text-muted-foreground">
        Um espaço para rever o que você registrou, no seu ritmo.
      </p>

      <JourneyContent query={query} />
    </div>
  )
}

function JourneyContent({ query }) {
  if (query.isPending) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label="Carregando sua jornada">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    )
  }

  // aria-live na região, para o leitor de tela anunciar o erro quando ele aparecer
  if (query.isError) {
    return (
      <div aria-live="polite">
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>Não foi possível carregar sua jornada</AlertDescription>
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

  // Cada seção decide o próprio estado vazio: uma vazia não esconde a outra
  return (
    <>
      <RecentCheckIns checkIns={query.data.check_ins} />
      <MyPlans plans={query.data.plans} />
    </>
  )
}

function RecentCheckIns({ checkIns }) {
  return (
    <section aria-labelledby="checkins-heading" className="flex flex-col gap-3">
      <h2 id="checkins-heading" className="text-lg font-semibold">
        Check-ins recentes
      </h2>

      {checkIns.length === 0 ? (
        <Card className="gap-3 p-4">
          <p className="text-base text-muted-foreground">Você ainda não fez nenhum check-in</p>
          <Link to="/checkin" className={buttonVariants({ size: 'lg' })}>
            Fazer check-in
          </Link>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {checkIns.map((checkIn) => (
            <li key={checkIn.id}>
              <CheckInItem checkIn={checkIn} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function CheckInItem({ checkIn }) {
  const { mood, note, checked_at: checkedAt } = checkIn
  const [expanded, setExpanded] = useState(false)
  const [canExpand, setCanExpand] = useState(false)

  const day = formatRelativeDay(checkedAt)
  const time = formatTime(checkedAt)
  // "Hoje, 08:30"; "Ontem" e datas antigas aparecem sem a hora
  const when = day === 'Hoje' && time ? `Hoje, ${time}` : day

  // Mede se o texto passa de 2 linhas enquanto recolhido; o botão só aparece se for o caso.
  // Depois de expandir, canExpand continua true para o botão virar "Ver menos".
  function measureNote(element) {
    if (element && !expanded) {
      setCanExpand(element.scrollHeight > element.clientHeight + 1)
    }
  }

  return (
    <Card className="gap-1 p-4">
      <div className="flex items-center gap-3">
        {mood.emoji && (
          <span className="text-3xl leading-none" aria-hidden="true">
            {mood.emoji}
          </span>
        )}
        <div className="flex min-w-0 flex-col">
          <p className="text-base font-medium">{mood.label}</p>
          <time dateTime={checkedAt} className="text-sm text-muted-foreground">
            {when}
          </time>
        </div>
      </div>

      {note && (
        <>
          {/* A nota é texto simples: o React escapa o conteúdo e nada vira HTML */}
          <p
            ref={measureNote}
            className={`text-sm break-words whitespace-pre-line text-muted-foreground ${
              expanded ? '' : 'line-clamp-2'
            }`}
          >
            {note}
          </p>
          {canExpand && (
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
              className="flex min-h-11 items-center self-start text-sm text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {expanded ? 'Ver menos' : 'Ver nota completa'}
            </button>
          )}
        </>
      )}
    </Card>
  )
}

function MyPlans({ plans }) {
  return (
    <section aria-labelledby="plans-heading" className="flex flex-col gap-3">
      <h2 id="plans-heading" className="text-lg font-semibold">
        Meus planos
      </h2>

      {plans.length === 0 ? (
        <Card className="gap-3 p-4">
          <p className="text-base text-muted-foreground">Você ainda não começou nenhum plano</p>
          <Link to="/planos" className={buttonVariants({ size: 'lg' })}>
            Ver planos
          </Link>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {plans.map((plan) => (
            <li key={plan.id}>
              <PlanItem plan={plan} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function PlanItem({ plan }) {
  const isFinished = plan.total_days > 0 && plan.completed_days >= plan.total_days

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold">{plan.title}</h3>
        {isFinished && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
            <CircleCheck className="size-3.5" aria-hidden="true" />
            Concluído
          </span>
        )}
      </div>

      <PlanProgress
        completedDays={plan.completed_days}
        totalDays={plan.total_days}
        label="dias concluídos"
      />

      <Link
        to="/planos/$planId"
        params={{ planId: plan.id }}
        className="flex min-h-11 items-center justify-between text-base text-primary underline-offset-4 hover:underline"
      >
        {isFinished ? 'Rever o plano' : 'Continuar o plano'}
        <ChevronRight className="size-4" aria-hidden="true" />
      </Link>
    </Card>
  )
}
