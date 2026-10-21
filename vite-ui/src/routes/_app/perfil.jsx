import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/perfil')({
  staticData: { title: 'Perfil' },
  component: PerfilPage,
})

function PerfilPage() {
  return <p className="text-muted-foreground">Conteúdo do Perfil.</p>
}
