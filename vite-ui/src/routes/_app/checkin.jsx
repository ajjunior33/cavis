import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Check, CircleAlert, Loader2 } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { createCheckInSchema, NOTE_MAX_LENGTH } from '@/schemas/checkin'
import { createCheckIn, getMoods } from '@/services/checkins'

export const Route = createFileRoute('/_app/checkin')({
  staticData: { title: 'Check-in' },
  component: CheckinPage,
})

// O catálogo de moods muda pouco: 1 hora sem refetch automático
const MOODS_STALE_TIME = 1000 * 60 * 60

const SAVE_ERROR_MESSAGE = 'Não foi possível salvar seu check-in. Tente novamente.'

function CheckinPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const form = useForm({
    resolver: zodResolver(createCheckInSchema),
    defaultValues: { mood_id: '', note: '' },
  })

  const moodsQuery = useQuery({
    queryKey: ['moods'],
    queryFn: getMoods,
    staleTime: MOODS_STALE_TIME,
  })

  const mutation = useMutation({
    mutationFn: createCheckIn,
    onSuccess: () => {
      // Sem await: marca como desatualizado e só refaz o que estiver ativo
      queryClient.invalidateQueries({ queryKey: ['today'] })
      queryClient.invalidateQueries({ queryKey: ['journey'] })
      queryClient.invalidateQueries({ queryKey: ['check-ins'] })
      navigate({ to: '/hoje' })
    },
    // Sem navegar e sem resetar o form: seleção e nota ficam como estavam.
    // Um 401 é tratado pelo interceptor (logout), então nada específico aqui.
    onError: () => {
      toast.error(SAVE_ERROR_MESSAGE)
    },
  })

  const isSaving = mutation.isPending
  const selectedMoodId = useWatch({ control: form.control, name: 'mood_id' })

  function selectMood(id) {
    form.setValue('mood_id', id, { shouldValidate: true })
  }

  function onSubmit(values) {
    // `values` já vem do schema: { mood_id } ou { mood_id, note } (nota trimada)
    mutation.mutate(values)
  }

  const submit = form.handleSubmit(onSubmit)
  const moods = moodsQuery.data ?? []

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold">Como você está se sentindo agora?</h2>
        <p className="text-sm text-muted-foreground">
          Escolha o que mais se aproxima do seu momento.
        </p>
      </div>

      <MoodList
        query={moodsQuery}
        moods={moods}
        selectedMoodId={selectedMoodId}
        onSelect={selectMood}
        disabled={isSaving}
      />

      <Controller
        name="note"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="checkin-note">Quer escrever algo sobre isso?</FieldLabel>
            <Textarea
              {...field}
              id="checkin-note"
              rows={3}
              maxLength={NOTE_MAX_LENGTH}
              disabled={isSaving}
              placeholder="Opcional"
              aria-invalid={fieldState.invalid}
              aria-describedby="checkin-note-count"
              // O componente base usa md:text-sm; aqui mantemos 16px (evita zoom no iOS)
              className="md:text-base!"
            />
            <p id="checkin-note-count" className="text-right text-xs text-muted-foreground">
              {field.value.length}/{NOTE_MAX_LENGTH}
            </p>
            {fieldState.invalid && (
              <p role="alert" className="text-sm text-destructive">
                {fieldState.error?.message}
              </p>
            )}
          </Field>
        )}
      />

      {/* Fixo no fim da área rolável, logo acima da tab bar (que já aplica a safe-area).
          -mx-4/-mb-4 compensam o padding do layout para ocupar a largura toda. */}
      <div className="sticky bottom-0 z-10 -mx-4 -mb-4 flex flex-col gap-3 border-t bg-surface px-4 py-3">
        {mutation.isError && (
          <Alert variant="destructive" role="status" aria-live="polite" className="pr-2.5">
            <CircleAlert aria-hidden="true" />
            <AlertDescription>{SAVE_ERROR_MESSAGE}</AlertDescription>
            <AlertAction className="static col-span-2 mt-2">
              <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={submit}>
                Tentar novamente
              </Button>
            </AlertAction>
          </Alert>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={!selectedMoodId || isSaving}
          aria-busy={isSaving}
        >
          {isSaving && <Loader2 className="animate-spin" aria-hidden="true" />}
          {isSaving ? 'Salvando...' : 'Registrar check-in'}
        </Button>
      </div>
    </form>
  )
}

function MoodList({ query, moods, selectedMoodId, onSelect, disabled }) {
  if (query.isPending) {
    return (
      <div className="grid grid-cols-2 gap-3" aria-busy="true" aria-label="Carregando opções">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
    )
  }

  if (query.isError) {
    return (
      <Alert variant="destructive">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>Não foi possível carregar as opções</AlertDescription>
        <AlertAction className="static col-span-2 mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={query.isFetching}
            onClick={() => query.refetch()}
          >
            {query.isFetching && <Loader2 className="animate-spin" aria-hidden="true" />}
            Recarregar
          </Button>
        </AlertAction>
      </Alert>
    )
  }

  if (moods.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
        Não há opções disponíveis no momento. Volte daqui a pouco.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {moods.map((mood) => {
        const selected = mood.id === selectedMoodId

        return (
          <button
            key={mood.id}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onSelect(mood.id)}
            className={cn(
              'relative flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 bg-card p-3 text-card-foreground outline-none transition-colors',
              'hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
              'aria-pressed:border-primary aria-pressed:bg-accent',
            )}
          >
            {selected && (
              <Check
                className="absolute top-2 right-2 size-4 text-primary"
                aria-hidden="true"
              />
            )}
            {mood.emoji && (
              <span className="text-4xl leading-none" aria-hidden="true">
                {mood.emoji}
              </span>
            )}
            <span className="text-sm font-medium">{mood.label}</span>
          </button>
        )
      })}
    </div>
  )
}
