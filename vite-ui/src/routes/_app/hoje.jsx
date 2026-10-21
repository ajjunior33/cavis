import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CircleAlert, Clock, Loader2 } from 'lucide-react'
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getToday } from '@/services/today'

export const Route = createFileRoute('/_app/hoje')({
  // O h1 da tela ("Hoje") é o do header do layout _app, que usa este título
  staticData: { title: 'Hoje' },
  component: HojePage,
})

const TIMEZONE = 'America/Sao_Paulo'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: TIMEZONE,
})

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TIMEZONE,
})

function HojePage() {
  const query = useQuery({ queryKey: ['today'], queryFn: getToday })

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base text-muted-foreground">{dateFormatter.format(new Date())}</p>

      <TodayContent query={query} />
    </div>
  )
}

function TodayContent({ query }) {
  if (query.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Carregando seu dia">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
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
          <AlertDescription>Não foi possível carregar seu dia</AlertDescription>
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

  const { check_in: checkIn, content } = query.data

  // Estado B: sem check-in
  if (!checkIn) {
    return (
      <Card className="gap-3 p-4">
        <h2 className="text-lg font-semibold">Que tal começar com um check-in?</h2>
        <p className="text-base text-muted-foreground">Leva menos de um minuto.</p>
        <Link to="/checkin" className={buttonVariants({ size: 'lg' })}>
          Fazer check-in
        </Link>
      </Card>
    )
  }

  return (
    <>
      <CheckInCard checkIn={checkIn} />

      {content ? (
        <>
          <Card className="gap-2 p-4">
            <h2 className="text-lg font-semibold">Reflexão do dia</h2>
            <p className="text-base font-medium">{content.title}</p>
            <p className="text-base whitespace-pre-line">{content.reflection}</p>
          </Card>

          <Card className="gap-2 p-4">
            <h2 className="text-lg font-semibold">Prática do dia</h2>
            <p className="text-base whitespace-pre-line">{content.practice}</p>
            {content.duration_min != null && (
              <p className="flex items-center gap-1.5 text-base text-muted-foreground">
                <Clock className="size-4" aria-hidden="true" />~{content.duration_min} min
              </p>
            )}
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Conteúdo de demonstração. Não substitui acompanhamento profissional.
          </p>
        </>
      ) : (
        // Estado C: check-in feito, mas sem conteúdo para o mood
        <Card className="gap-3 p-4">
          <h2 className="text-lg font-semibold">Prática do dia</h2>
          <p className="text-base text-muted-foreground">
            Ainda não temos uma prática para este momento. Volte em breve.
          </p>
          <Link to="/planos" className="flex min-h-11 items-center text-base text-primary underline-offset-4 hover:underline">
            Conhecer os planos
          </Link>
        </Card>
      )}
    </>
  )
}

function CheckInCard({ checkIn }) {
  const { mood, checked_at: checkedAt } = checkIn
  const time = checkedAt ? timeFormatter.format(new Date(checkedAt)) : null

  return (
    <Card className="gap-1 p-4">
      <h2 className="sr-only">Seu check-in</h2>
      <div className="flex items-center gap-3">
        {mood.emoji && (
          <span className="text-4xl leading-none" aria-hidden="true">
            {mood.emoji}
          </span>
        )}
        <div className="flex flex-col">
          <p className="text-base font-medium">Você registrou: {mood.label}</p>
          {time && <p className="text-base text-muted-foreground">às {time}</p>}
        </div>
      </div>
      <Link
        to="/checkin"
        className="flex min-h-11 items-center text-base text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Fazer outro check-in
      </Link>
    </Card>
  )
}
