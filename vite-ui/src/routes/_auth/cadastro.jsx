import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { PasswordChecklist } from '@/components/auth/password-checklist'
import { PasswordInput } from '@/components/auth/password-input'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { classifyAuthError, NETWORK_ERROR_MESSAGE } from '@/lib/auth-errors'
import { signUpSchema } from '@/schemas/auth'
import { createUser, login } from '@/services/auth'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_auth/cadastro')({
  component: CadastroPage,
})

async function signUpAndLogin({ name, email, password }) {
  await createUser({ name, email, password })

  // Login automático. Se falhar, a conta já existe: devolvemos null
  // e o usuário segue para /login em vez de ver um erro enganoso.
  try {
    return await login({ email, password })
  } catch {
    return null
  }
}

function CadastroPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)

  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const password = useWatch({ control: form.control, name: 'password' })

  const mutation = useMutation({
    mutationFn: signUpAndLogin,
    onSuccess: (session) => {
      toast.success('Conta criada com sucesso')

      if (session) {
        setSession(session)
        navigate({ to: '/hoje' })
      } else {
        navigate({ to: '/login' })
      }
    },
    onError: (error) => {
      if (classifyAuthError(error) === 'email-taken') {
        form.setError('email', { message: 'Esse e-mail já tem uma conta. Que tal entrar?' })
        form.setFocus('email')
      } else {
        toast.error(NETWORK_ERROR_MESSAGE)
      }
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Vamos começar</h1>
        <p className="text-sm text-muted-foreground">
          Crie sua conta em poucos passos. Leva menos de um minuto.
        </p>
      </div>

      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate className="flex flex-col gap-6">
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="signup-name">Nome</FieldLabel>
                <Input
                  {...field}
                  id="signup-name"
                  autoComplete="name"
                  autoFocus
                  placeholder="Como você gostaria de ser chamado"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.invalid ? 'signup-name-error' : undefined}
                />
                {fieldState.invalid && (
                  <FieldError id="signup-name-error" errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="signup-email">E-mail</FieldLabel>
                <Input
                  {...field}
                  id="signup-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.invalid ? 'signup-email-error' : undefined}
                />
                {fieldState.invalid && (
                  <FieldError id="signup-email-error" errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="signup-password">Senha</FieldLabel>
                <PasswordInput
                  {...field}
                  id="signup-password"
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                  aria-describedby="signup-password-rules"
                />
                {/* O checklist já mostra o que falta; não repetimos a mensagem do zod aqui. */}
                <PasswordChecklist id="signup-password-rules" value={password} />
              </Field>
            )}
          />

          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="signup-confirm-password">Confirmar senha</FieldLabel>
                <PasswordInput
                  {...field}
                  id="signup-confirm-password"
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.invalid ? 'signup-confirm-password-error' : undefined}
                />
                {fieldState.invalid && (
                  <FieldError id="signup-confirm-password-error" errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        <Button type="submit" size="lg" disabled={mutation.isPending} aria-busy={mutation.isPending}>
          {mutation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {mutation.isPending ? 'Criando sua conta...' : 'Criar conta'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <Link to="/login" className="font-medium text-primary underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </div>
  )
}
