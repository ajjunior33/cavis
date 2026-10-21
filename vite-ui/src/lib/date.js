// Formatação de datas em pt-BR sempre no fuso LOCAL do usuário (sem `timeZone` fixo).
// Para comparar dias não usamos toISOString().slice(): ele devolve a data em UTC,
// e um check-in das 22h em São Paulo cairia no "dia seguinte".

const LOCALE = 'pt-BR'

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
})

// "18 de out."
const shortDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
})

// "18 de out. de 2025" (só quando o ano não é o atual)
const shortDateWithYearFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function toValidDate(isoString) {
  const date = new Date(isoString)

  return Number.isNaN(date.getTime()) ? null : date
}

// Meia-noite local do dia da data, para contar dias de calendário (não blocos de 24h)
function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// Diferença em dias de calendário local. Math.round absorve os dias de 23h/25h do horário de verão.
function diffInLocalDays(date, reference) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000

  return Math.round((startOfLocalDay(reference) - startOfLocalDay(date)) / MS_PER_DAY)
}

// "Hoje" | "Ontem" | "18 de out." (com ano se for de outro ano). `now` existe para testes.
export function formatRelativeDay(isoString, now = new Date()) {
  const date = toValidDate(isoString)

  if (!date) return ''

  const diff = diffInLocalDays(date, now)

  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Ontem'

  const formatter =
    date.getFullYear() === now.getFullYear() ? shortDateFormatter : shortDateWithYearFormatter

  return formatter.format(date)
}

// "08:30"
export function formatTime(isoString) {
  const date = toValidDate(isoString)

  return date ? timeFormatter.format(date) : ''
}

// "outubro de 2025"
const monthYearFormatter = new Intl.DateTimeFormat(LOCALE, {
  month: 'long',
  year: 'numeric',
})

export function formatMonthYear(isoString) {
  const date = toValidDate(isoString)

  return date ? monthYearFormatter.format(date) : ''
}
