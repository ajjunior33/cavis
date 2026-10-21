import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeft, CircleAlert, CircleCheck, Circle, Loader2, PartyPopper } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { PlanProgress } from '@/components/plans/plan-progress'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { completePlanDay, getPlan, isNotFoundError } from '@/services/plans'

export const Route = createFileRoute('/_app/planos/$planId')({
  // O h1 da tela ("Planos") é o do header do layout _app; o título do plano é um h2
  staticData: { title: 'Planos' },
  component: PlanoDetalhePage,
  notFoundComponent: PlanoNaoEncontrado,
})

const COMPLETE_ERROR_MESSAGE = 'Não foi possível concluir este dia. Tente novamente.'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeZone: 'America/Sao_Paulo',
})

function getNextPendingDay(plan) {
  return plan.days.find((day) => !day.completed) ?? null
}

// O valor do item do Accordion é o número do dia (como texto)
function toOpenValue(day) {
  return day ? [String(day.day_number)] : []
}

function PlanoNaoEncontrado() {
  return (
    <div className="flex flex-col items-start gap-3" aria-live="polite">
      <h2 className="text-xl font-semibold">Plano não encontrado</h2>
      <p className="text-base text-muted-foreground">
        Esse plano não existe ou não está mais disponível.
      </p>
      <Link to="/planos" className={buttonVariants({ size: 'lg' })}>
        Ver todos os planos
      </Link>
    </div>
  )
}

function PlanoDetalhePage() {
  const { planId } = Route.useParams()

  const query = useQuery({
    queryKey: ['plan', planId],
    queryFn: () => getPlan(planId),
    // 404 é resposta definitiva: não faz sentido tentar de novo
    retry: (failureCount, error) => !isNotFoundError(error) && failureCount < 1,
  })

  // Plano inexistente: cai no notFoundComponent desta rota
  if (query.isError && isNotFoundError(query.error)) {
    throw notFound()
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/planos"
        className={buttonVariants({ variant: 'ghost', size: 'lg', className: 'self-start -ml-3' })}
      >
        <ArrowLeft aria-hidden="true" />
        Planos
      </Link>

      <PlanContent query={query} planId={planId} />

      <p className="text-center text-sm text-muted-foreground">
        Plano de demonstração. Não substitui acompanhamento profissional.
      </p>
    </div>
  )
}

function PlanContent({ query, planId }) {
  if (query.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Carregando o plano">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    )
  }

  // aria-live na região, para o leitor de tela anunciar o erro quando ele aparecer
  if (query.isError) {
    return (
      <div aria-live="polite">
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>Não foi possível carregar o plano</AlertDescription>
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

  return <PlanDetail plan={query.data} planId={planId} />
}

function PlanDetail({ plan, planId }) {
  const queryClient = useQueryClient()

  // Só o primeiro dia pendente começa aberto; depois o usuário (ou a conclusão) controla
  const [openDays, setOpenDays] = useState(() => toOpenValue(getNextPendingDay(plan)))

  // Trava síncrona contra toque duplo: isPending só muda após o próximo render
  const inFlight = useRef(false)

  const mutation = useMutation({
    mutationFn: completePlanDay,
    onSuccess: (updatedPlan, { dayNumber }) => {
      // A resposta da API é a fonte de verdade
      queryClient.setQueryData(['plan', planId], updatedPlan)
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      queryClient.invalidateQueries({ queryKey: ['journey'] })

      toast.success(`Dia ${dayNumber} concluído`)

      // Fluxo principal: abre o próximo dia pendente (ou fecha tudo ao terminar)
      setOpenDays(toOpenValue(getNextPendingDay(updatedPlan)))
    },
    // O botão volta a ficar disponível: o dia continua pendente no cache
    onError: () => {
      toast.error(COMPLETE_ERROR_MESSAGE)
    },
    onSettled: () => {
      inFlight.current = false
    },
  })

  const isBusy = mutation.isPending
  const pendingDayNumber = isBusy ? mutation.variables?.dayNumber : null
  const isFinished = plan.total_days > 0 && plan.completed_days >= plan.total_days
  const nextPendingDay = getNextPendingDay(plan)

  function handleComplete(dayNumber) {
    if (inFlight.current) return

    inFlight.current = true
    mutation.mutate({ planId, dayNumber })
  }

  return (
    <>
      <Card className="gap-3 p-4">
        <h2 className="text-xl font-semibold">{plan.title}</h2>
        <p className="text-base whitespace-pre-line text-muted-foreground">{plan.description}</p>
        <PlanProgress completedDays={plan.completed_days} totalDays={plan.total_days} label="dias" />
      </Card>

      {isFinished && (
        <Card className="gap-2 bg-accent p-4" role="status">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <PartyPopper className="size-5" aria-hidden="true" />
            Parabéns por chegar até aqui!
          </h2>
          <p className="text-base">
            Você concluiu todos os dias deste plano. Cada passo conta, e você pode voltar a qualquer
            dia para rever o que quiser.
          </p>
        </Card>
      )}

      {/* Mensagem de erro persistente (além do toast) para leitores de tela */}
      <p role="status" aria-live="polite" className="text-sm text-destructive empty:hidden">
        {mutation.isError ? COMPLETE_ERROR_MESSAGE : ''}
      </p>

      {plan.days.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-center text-base text-muted-foreground">
          Os dias deste plano ainda estão sendo preparados. Volte em breve.
        </p>
      ) : (
        <section aria-labelledby="plan-days-title" className="flex flex-col gap-2">
          <h2 id="plan-days-title" className="text-lg font-semibold">
            Dias do plano
          </h2>

          <Accordion value={openDays} onValueChange={setOpenDays} className="rounded-xl border">
            {plan.days.map((day) => (
              <DayItem
                key={day.id}
                day={day}
                isNext={day.day_number === nextPendingDay?.day_number}
                isBusy={isBusy}
                isCompleting={pendingDayNumber === day.day_number}
                onComplete={handleComplete}
              />
            ))}
          </Accordion>
        </section>
      )}
    </>
  )
}

function DayItem({ day, isNext, isBusy, isCompleting, onComplete }) {
  const { day_number: dayNumber, title, content, practice, completed, completed_at: completedAt } = day

  return (
    <AccordionItem value={String(dayNumber)} className="px-4">
      <AccordionTrigger className="min-h-11 items-center gap-3 py-3">
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-sm text-muted-foreground">
            Dia {dayNumber}
            {isNext && !completed && <span className="font-medium text-primary"> · Próximo</span>}
          </span>
          <span className="text-base font-medium">{title}</span>
        </span>

        {completed ? (
          <>
            <CircleCheck className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <span className="sr-only">Concluído</span>
          </>
        ) : (
          <>
            <Circle className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Pendente</span>
          </>
        )}
      </AccordionTrigger>

      <AccordionContent className="flex flex-col gap-4 text-base">
        <p className="whitespace-pre-line">{content}</p>

        {practice && (
          <div className="flex flex-col gap-1 rounded-lg bg-muted p-3">
            <h3 className="text-base font-semibold">Prática</h3>
            <p className="whitespace-pre-line">{practice}</p>
          </div>
        )}

        {completed ? (
          <>
            <p className="text-base text-muted-foreground">
              Concluído em {completedAt ? dateFormatter.format(new Date(completedAt)) : 'data não informada'}
            </p>
            <Button type="button" size="lg" disabled>
              Concluir Dia {dayNumber}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="lg"
            disabled={isBusy}
            aria-busy={isCompleting}
            onClick={() => onComplete(dayNumber)}
          >
            {isCompleting && <Loader2 className="animate-spin" aria-hidden="true" />}
            {isCompleting ? 'Concluindo...' : `Concluir Dia ${dayNumber}`}
          </Button>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}
