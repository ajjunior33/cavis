import { KeyRound } from 'lucide-react'

// Placeholder: troque o ícone por <img src="/icons/icon-192.png" /> ou pelo SVG do logo.
export function AppLogo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <KeyRound className="size-8" aria-hidden="true" />
      </div>
      <span className="text-xl font-semibold tracking-tight">Clavis</span>
    </div>
  )
}
