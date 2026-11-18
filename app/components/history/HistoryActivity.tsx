import type { VisitedEvent, VisitedItem } from '~/lib/visited'
import { cn } from '~/lib/utils'
import { buildVisitedHeatmap } from '~/lib/visited-analytics'

const LEVEL_CLASSES = [
  'bg-muted/70',
  'bg-primary/20',
  'bg-primary/40',
  'bg-primary/65',
  'bg-primary',
] as const

const WEEKDAY_ROW = ['一', '', '三', '', '五', '', '日']

function formatDay(ts: number): string {
  const date = new Date(ts)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

/** 全历史浏览活动：日历热力图，无卡片容器 */
export function HistoryActivity({
  items,
  events,
  now,
}: {
  items: VisitedItem[]
  events: VisitedEvent[]
  now: number
}) {
  const heatmap = buildVisitedHeatmap(items, events, now)
  const range = heatmap.firstTs !== null && heatmap.lastTs !== null
    ? `${formatDay(heatmap.firstTs)} — ${formatDay(heatmap.lastTs)}`
    : '暂无数据'

  return (
    <section aria-label="浏览活动" className="flex min-w-0 flex-col gap-4">
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">浏览活动</h3>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {range}
        </span>
      </header>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-muted-foreground">每日热力图</span>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
            <span>少</span>
            {LEVEL_CLASSES.map(level => (
              <span
                key={level}
                className={cn('size-2.5 rounded-[2px]', level)}
                aria-hidden
              />
            ))}
            <span>多</span>
          </div>
        </div>

        {heatmap.weeks.length === 0
          ? <p className="mt-3 text-xs text-muted-foreground">暂无访问数据</p>
          : (
              <div
                data-slot="history-heatmap-scroll"
                className="mt-2 min-w-0 max-w-full touch-pan-x overflow-x-auto overscroll-x-contain pb-1"
              >
                <div className="inline-flex flex-col gap-1">
                  <div className="flex gap-[1px] pl-[18px] text-[8px] leading-none text-muted-foreground/60 sm:gap-[2px] sm:text-[9px]">
                    {heatmap.weeks.map(week => (
                      <span key={week.key} className="w-2 shrink-0 sm:w-2.5">
                        {week.monthLabel}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-[1px] sm:gap-[2px]">
                    <div className="flex w-4 shrink-0 flex-col gap-[1px] text-[8px] leading-none text-muted-foreground/50 sm:gap-[2px]">
                      {WEEKDAY_ROW.map((label, index) => (
                        <span
                          key={index}
                          className="flex h-2 items-center sm:h-2.5"
                        >
                          {label}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-[1px] sm:gap-[2px]">
                      {heatmap.weeks.map(week => (
                        <div
                          key={week.key}
                          className="flex flex-col gap-[1px] sm:gap-[2px]"
                        >
                          {week.days.map(day => (
                            <span
                              key={day.key}
                              title={day.label}
                              className={cn(
                                'size-2 rounded-[2px] sm:size-2.5',
                                day.isFuture
                                  ? 'invisible'
                                  : LEVEL_CLASSES[day.level],
                                day.isToday && 'ring-1 ring-foreground/50',
                              )}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
      </div>
    </section>
  )
}
