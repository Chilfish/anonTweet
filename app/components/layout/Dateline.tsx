import { cn } from '~/lib/utils'

const WEEKDAYS = [
  'SUN',
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
] as const

/**
 * 日付线：等宽日期 + 细分隔线 + 右侧栏目名。
 * 装饰性信息（今天的日期、当前栏目），不承载业务数据。
 */
export function Dateline({
  label,
  className,
}: {
  label?: string
  className?: string
}) {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  const date = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`
  const weekday = WEEKDAYS[now.getDay()] ?? ''

  return (
    <div
      className={cn(
        'flex items-center gap-3 text-[10px] text-muted-foreground/50',
        className,
      )}
    >
      <span className="font-mono tabular-nums tracking-[0.14em]">
        {date}
        {' '}
        {weekday}
      </span>
      <span aria-hidden className="h-px flex-1 bg-border/70" />
      {label && (
        <span className="tracking-[0.18em] uppercase">
          {label}
        </span>
      )}
    </div>
  )
}
