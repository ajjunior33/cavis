import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CircleAlert, Loader2, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ChangePasswordSheet } from '@/components/profile/change-password-sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiError } from '@/lib/api-error'
import { formatMonthYear } from '@/lib/date'
import { queryClient } from '@/lib/query-client'
import { updateNameSchema } from '@/schemas/profile'
import { getMe, updateName } from '@/services/profile'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_app/perfil')({
  staticData: { title: 'Perfil' },
  component: PerfilPage,
})

function getInitials(name) {
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) return '?'

  const first = words[0][0]
  const last = words.length > 1 ? words[words.length - 1][0] : ''

  return `${first}${last}`.toUpperCase()
}

function PerfilPage() {
  const query = useQuery({ queryKey: ['me'], queryFn: getMe })
  const storedUser = useAuthStore((state) => state.user)

  const profile = query.data
  // Falha sem dado em cache: mostramos o que o auth-store já sabe
  const loadFailed = query.isError && !profile

  return (
    <div className="flex flex-col gap-6">
      {query.isPending ? (
        <HeaderSkeleton />
      ) : (
        <ProfileHeader
          name={profile?.name ?? storedUser?.name}
          email={profile?.email ?? storedUser?.email}
          createdAt={profile?.created_at}
          isDemo={profile?.is_demo === true}
        />
      )}

      {loadFailed && <LoadError onRetry={() => query.refetch()} isFetching={query.isFetching} />}

      {query.isPending && <FormsSkeleton />}

      {profile && (
        <>
          <AccountSection profile={profile} />
          <SecuritySection isDemo={profile.is_demo === true} />
        </>
      )}

      <AboutSection />
      <LogoutSection />
    </div>
  )
}

function HeaderSkeleton() {
  return (
    <div className="flex items-center gap-4" aria-busy="true" aria-label="Carregando seu perfil">
      <Skeleton className="size-16 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
    </div>
  )
}

function FormsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-28 rounded-xl" />
    </div>
  )
}

function LoadError({ onRetry, isFetching }) {
  // aria-live na região, para o leitor de tela anunciar o erro quando ele aparecer
  return (
    <div aria-live="polite">
      <Alert variant="destructive">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>Não foi possível carregar seu perfil</AlertDescription>
        <AlertAction className="static col-span-2 mt-2">
          <Button type="button" variant="outline" size="sm" disabled={isFetching} onClick={onRetry}>
            {isFetching && <Loader2 className="animate-spin" aria-hidden="true" />}
            Tentar novamente
          </Button>
        </AlertAction>
      </Alert>
    </div>
  )
}

function ProfileHeader({ name, email, createdAt, isDemo }) {
  const memberSince = createdAt ? formatMonthYear(createdAt) : ''

  return (
    <section aria-label="Resumo da conta" className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Avatar size="lg" className="size-16">
          <AvatarFallback className="text-xl font-medium" aria-hidden="true">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-col">
          <h2 className="truncate text-lg font-semibold">{name}</h2>
          <p className="truncate text-base text-muted-foreground">{email}</p>
          {memberSince && (
            <p className="text-sm text-muted-foreground">Membro desde {memberSince}</p>
          )}
        </div>
      </div>

      {isDemo && (
        <div className="flex flex-col items-start gap-1">
          <Badge variant="secondary">Conta de demonstração</Badge>
          <p className="text-sm text-muted-foreground">
            Os dados desta conta são fictícios.
          </p>
        </div>
      )}
    </section>
  )
}

function AccountSection({ profile }) {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const setSession = useAuthStore((state) => state.setSession)

  // `values` sincroniza com ['me'] quando os dados chegam; keepDirtyValues não apaga o que a pessoa está digitando
  const form = useForm({
    resolver: zodResolver(updateNameSchema),
    values: { name: profile.name },
    resetOptions: { keepDirtyValues: true },
  })

  const mutation = useMutation({
    mutationFn: updateName,
    onSuccess: (updated) => {
      queryClient.setQueryData(['me'], updated)
      setSession({ token, user: { ...user, ...updated } })
      form.reset({ name: updated.name })
      toast.success('Nome atualizado')
    },
    onError: (error) => {
      // O valor digitado é mantido: não resetamos o formulário
      if (getApiError(error).status === 400) {
        form.setError('name', { message: 'Confira o nome informado' })
        form.setFocus('name')
      } else {
        toast.error('Não foi possível salvar. Tente novamente.')
      }
    },
  })

  return (
    <Card className="gap-4 p-4">
      <h2 className="text-lg font-semibold">Dados da conta</h2>

      <form
        onSubmit={form.handleSubmit(({ name }) => mutation.mutate({ name }))}
        noValidate
        className="flex flex-col gap-4"
      >
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="profile-name">Nome</FieldLabel>
                <Input
                  {...field}
                  id="profile-name"
                  autoComplete="name"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.invalid ? 'profile-name-error' : undefined}
                />
                {fieldState.invalid && (
                  <FieldError id="profile-name-error" errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Field>
            <FieldLabel htmlFor="profile-email">E-mail</FieldLabel>
            <Input id="profile-email" value={profile.email} readOnly aria-readonly="true" />
          </Field>
        </FieldGroup>

        <Button
          type="submit"
          disabled={!form.formState.isDirty || mutation.isPending}
          aria-busy={mutation.isPending}
        >
          {mutation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {mutation.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </Card>
  )
}

function SecuritySection({ isDemo }) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <Card className="gap-3 p-4">
      <h2 className="text-lg font-semibold">Segurança</h2>

      {isDemo ? (
        <>
          <Button type="button" variant="outline" disabled aria-describedby="profile-demo-password">
            Alterar senha
          </Button>
          <p id="profile-demo-password" className="text-sm text-muted-foreground">
            A senha da conta de demonstração não pode ser alterada
          </p>
        </>
      ) : (
        <>
          <Button type="button" variant="outline" onClick={() => setSheetOpen(true)}>
            Alterar senha
          </Button>
          <ChangePasswordSheet open={sheetOpen} onOpenChange={setSheetOpen} />
        </>
      )}
    </Card>
  )
}

function AboutSection() {
  return (
    <Card className="gap-2 p-4">
      <h2 className="text-lg font-semibold">Sobre o app</h2>
      <p className="text-base text-muted-foreground">
        O conteúdo do Clavis é de demonstração. O app não oferece diagnóstico, terapia ou cura e
        não substitui acompanhamento profissional.
      </p>
    </Card>
  )
}

function LogoutSection() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const [open, setOpen] = useState(false)

  function handleConfirm() {
    logout()
    // Dados do usuário não podem sobrar em memória para a próxima sessão
    queryClient.clear()
    setOpen(false)
    navigate({ to: '/login' })
  }

  return (
    <>
      <Button type="button" variant="destructive" size="lg" onClick={() => setOpen(true)}>
        <LogOut aria-hidden="true" />
        Sair
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Você precisará entrar novamente para acessar o Clavis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirm}>
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
