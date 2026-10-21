import { Check, Circle } from 'lucide-react'
import { PASSWORD_RULES } from '@/schemas/auth'
import { cn } from '@/lib/utils'

export function PasswordChecklist({ id, value = '' }) {
  return (
    <ul id={id} aria-label="Requisitos da senha" className="flex flex-col gap-1 text-sm">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value)

        return (
          <li
            key={rule.id}
            className={cn(
              'flex items-center gap-2 transition-colors',
              ok ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {ok ? (
              <Check className="size-4 text-primary" aria-hidden="true" />
            ) : (
              <Circle className="size-4" aria-hidden="true" />
            )}
            <span>{rule.label}</span>
            <span className="sr-only">{ok ? '(atendido)' : '(pendente)'}</span>
          </li>
        )
      })}
    </ul>
  )
}
