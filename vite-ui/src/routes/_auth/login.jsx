import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { PasswordInput } from '@/components/auth/password-input'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { classifyAuthError, NETWORK_ERROR_MESSAGE } from '@/lib/auth-errors'
import { loginSchema } from '@/schemas/auth'
import { login } from '@/services/auth'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      setSession(session)
      navigate({ to: '/hoje' })
    },
    onError: (error) => {
      if (classifyAuthError(error) === 'invalid-credentials') {
        form.setError('root', { message: 'E-mail ou senha incorretos' })
      } else {
        toast.error(NETWORK_ERROR_MESSAGE)
      }
    },
  })

  function onSubmit(values) {
    form.clearErrors('root')
    mutation.mutate(values)
  }

  const rootError = form.formState.errors.root?.message

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Que bom ter você de volta</h1>
        <p className="text-sm text-muted-foreground">Entre para continuar de onde parou.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        <FieldGroup>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="login-email">E-mail</FieldLabel>
                <Input
                  {...field}
                  id="login-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="voce@exemplo.com"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.invalid ? 'login-email-error' : undefined}
                />
                {fieldState.invalid && (
                  <FieldError id="login-email-error" errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="login-password">Senha</FieldLabel>
                <PasswordInput
                  {...field}
                  id="login-password"
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.invalid ? 'login-password-error' : undefined}
                />
                {fieldState.invalid && (
                  <FieldError id="login-password-error" errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        {rootError && <FieldError>{rootError}</FieldError>}

        <Button type="submit" size="lg" disabled={mutation.isPending} aria-busy={mutation.isPending}>
          {mutation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {mutation.isPending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" className="font-medium text-primary underline underline-offset-4">
          Criar conta
        </Link>
      </p>
    </div>
  )
}
