import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/home')({
  staticData: { title: 'Home' },
  component: HomePage,
})

function HomePage() {
  return <p className="text-muted-foreground">Conteúdo da Home.</p>
}
