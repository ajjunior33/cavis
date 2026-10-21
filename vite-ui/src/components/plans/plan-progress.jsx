import { Progress } from '@/components/ui/progress'

function getPercent(completedDays, totalDays) {
  if (!totalDays) return 0

  return Math.min(100, Math.round((completedDays / totalDays) * 100))
}

// Barra + texto "X de Y dias concluídos". O aria-label garante o nome acessível da barra.
export function PlanProgress({ completedDays, totalDays, label = 'dias concluídos' }) {
  const percent = getPercent(completedDays, totalDays)

  return (
    <div className="flex flex-col gap-1.5">
      <Progress
        value={percent}
        aria-label={`Progresso: ${completedDays} de ${totalDays} dias`}
        className="gap-0"
      />
      <p className="text-sm text-muted-foreground">
        {completedDays} de {totalDays} {label}
      </p>
    </div>
  )
}
