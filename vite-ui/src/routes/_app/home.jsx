import { createFileRoute, redirect } from '@tanstack/react-router'

// /home foi substituída por /hoje; mantida só para links e favoritos antigos
export const Route = createFileRoute('/_app/home')({
  beforeLoad: () => {
    throw redirect({ to: '/hoje', replace: true })
  },
})
