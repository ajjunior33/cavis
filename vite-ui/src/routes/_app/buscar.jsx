import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/buscar')({
  staticData: { title: 'Buscar' },
  component: BuscarPage,
})

function BuscarPage() {
  return <p className="text-muted-foreground">Conteúdo de Buscar.</p>
}
