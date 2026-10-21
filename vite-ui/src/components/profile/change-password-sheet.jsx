import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { PasswordChecklist } from '@/components/auth/password-checklist'
import { PasswordInput } from '@/components/auth/password-input'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { getApiError, WRONG_PASSWORD_MESSAGE } from '@/lib/api-error'
import { changePasswordSchema, toChangePasswordPayload } from '@/schemas/profile'
import { changePassword } from '@/services/profile'

const RATE_LIMIT_SECONDS = 60
const RATE_LIMIT_MESSAGE = 'Muitas tentativas. Aguarde um minuto e tente novamente.'
const GENERIC_ERROR_MESSAGE = 'Não foi possível alterar a senha. Tente novamente.'

const EMPTY_VALUES = { current_password: '', new_password: '', confirm_password: '' }

// Este componente fica montado mesmo com o Sheet fechado, então o contador do 429
// sobrevive a fechar e reabrir o Sheet (o limite da API é por minuto, não por abertura).
export function ChangePasswordSheet({ open, onOpenChange }) {
  const [formError, setFormError] = useState(null)
  const [cooldown, setCooldown] = useState(0)

  const form = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY_VALUES,
  })

  const newPassword = useWatch({ control: form.control, name: 'new_password' })

  useEffect(() => {
    if (cooldown <= 0) return

    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000)

    return () => clearTimeout(timer)
  }, [cooldown])

  const mutation = useMutation({
    mutationFn: (values) => changePassword(toChangePasswordPayload(values)),
    onSuccess: () => {
      handleOpenChange(false)
      toast.success('Senha alterada')
    },
    onError: (error) => {
      const { status, message } = getApiError(error)

      if (status === 401 && message === WRONG_PASSWORD_MESSAGE) {
        form.setError('current_password', { message: 'Senha atual incorreta' })
        form.setFocus('current_password')
      } else if (status === 401) {
        // Token inválido/expirado: o interceptor já fez logout e está redirecionando.
      } else if (status === 400) {
        setFormError('Confira os dados informados')
      } else if (status === 403) {
        toast.error(message || 'A senha da conta de demonstração não pode ser alterada')
        handleOpenChange(false)
      } else if (status === 429) {
        setCooldown(RATE_LIMIT_SECONDS)
      } else {
        toast.error(GENERIC_ERROR_MESSAGE)
      }
    },
  })

  // Nenhuma senha sobrevive ao fechamento: campos, erros e as variáveis da mutation
  function handleOpenChange(nextOpen) {
    if (!nextOpen) {
      form.reset(EMPTY_VALUES)
      mutation.reset()
      setFormError(null)
    }

    onOpenChange(nextOpen)
  }

  function onSubmit(values) {
    setFormError(null)
    mutation.mutate(values)
  }

  const isBlocked = cooldown > 0
  const submitDisabled = mutation.isPending || isBlocked
  const alertMessage = isBlocked ? RATE_LIMIT_MESSAGE : formError

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-xl pb-safe md:mx-auto md:max-w-120"
      >
        <SheetHeader>
          <SheetTitle>Alterar senha</SheetTitle>
          <SheetDescription>Informe sua senha atual e escolha uma nova.</SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-6 px-4 pb-4"
        >
          <FieldGroup>
            <Controller
              name="current_password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="profile-current-password">Senha atual</FieldLabel>
                  <PasswordInput
                    {...field}
                    id="profile-current-password"
                    autoComplete="current-password"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? 'profile-current-password-error' : undefined}
                  />
                  {fieldState.invalid && (
                    <FieldError id="profile-current-password-error" errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="new_password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="profile-new-password">Nova senha</FieldLabel>
                  <PasswordInput
                    {...field}
                    id="profile-new-password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                    aria-describedby="profile-new-password-rules profile-new-password-error"
                  />
                  <PasswordChecklist id="profile-new-password-rules" value={newPassword} />
                  {/* O checklist cobre os requisitos; aqui só o erro "igual à atual" */}
                  {fieldState.error?.message === 'A nova senha precisa ser diferente da atual' && (
                    <FieldError id="profile-new-password-error" errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="confirm_password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="profile-confirm-password">Confirmar nova senha</FieldLabel>
                  <PasswordInput
                    {...field}
                    id="profile-confirm-password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? 'profile-confirm-password-error' : undefined}
                  />
                  {fieldState.invalid && (
                    <FieldError id="profile-confirm-password-error" errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          {/* aria-live: o leitor de tela anuncia o erro quando ele aparece */}
          <div aria-live="polite">
            {alertMessage && (
              <p role="alert" className="text-sm text-destructive">
                {alertMessage}
              </p>
            )}
          </div>

          <Button type="submit" size="lg" disabled={submitDisabled} aria-busy={mutation.isPending}>
            {mutation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {mutation.isPending
              ? 'Alterando...'
              : isBlocked
                ? `Aguarde ${cooldown}s`
                : 'Alterar senha'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
