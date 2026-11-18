import type { VisitedEvent, VisitedItem } from '~/lib/visited'
import { cn } from '~/lib/utils'
import {
  buildVisitHours,
  resolveVisitedEvents,
  topVisitedAuthors,
} from '~/lib/visited-analytics'

/** 常看作者 + 时段分布，两列之间只用一条分隔线 */
export function HistoryInsights({
  items,
  events,
  activeAuthor,
  onAuthorSelect,
}: {
  items: VisitedItem[]
  events: VisitedEvent[]
  activeAuthor?: string
  onAuthorSelect: (key: string) => void
}) {
  const authors = topVisitedAuthors(items, 5)
  const hours = buildVisitHours(resolveVisitedEvents(items, events))
  const peak = Math.max(1, ...hours.map(hour => hour.count))
  const topVisits = Math.max(1, ...authors.map(author => author.visits))
  const busiestHour = hours.reduce(
    (best, hour) => (hour.count > best.count
      ? hour
      : best),
    hours[0]!,
  )

  return (
    <section
      aria-label="浏览偏好"
      className="grid gap-6 border-t border-border/60 pt-5 sm:grid-cols-[1.15fr_1fr] sm:divide-x sm:divide-border/60"
    >
      <div className="min-w-0 sm:pr-6">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">常看作者</h3>
          <span className="text-[11px] text-muted-foreground/70">按浏览次数</span>
        </div>

        {authors.length === 0
          ? <p className="mt-3 text-xs text-muted-foreground">暂无作者数据</p>
          : (
              <ul className="mt-2 flex flex-col">
                {authors.map((author, index) => (
                  <li key={author.key}>
                    <button
                      type="button"
                      onClick={() => onAuthorSelect(author.key)}
                      className={cn(
                        'group flex w-full items-center gap-3 rounded-md px-1 py-1.5 text-left transition-colors hover:bg-muted/40',
                        activeAuthor === author.key && 'text-primary',
                      )}
                    >
                      <span className="w-4 shrink-0 text-[11px] tabular-nums text-muted-foreground/50">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {author.label}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {`${author.visits} 次`}
                      </span>
                      <span className="hidden h-1 w-14 shrink-0 overflow-hidden rounded-full bg-muted sm:block">
                        <span
                          className="block h-full rounded-full bg-primary/50"
                          style={{
                            width: `${(author.visits / topVisits) * 100}%`,
                          }}
                        />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
      </div>

      <div className="min-w-0 sm:pl-6">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">浏览时段</h3>
          <span className="text-[11px] tabular-nums text-muted-foreground/70">
            {`${busiestHour.hour}–${busiestHour.hour + 1} 时最多`}
          </span>
        </div>

        <div className="mt-4 flex h-16 items-end gap-px">
          {hours.map(hour => (
            <div
              key={hour.hour}
              className="flex h-full flex-1 items-end"
              title={`${hour.hour} 时：${hour.count} 次`}
            >
              <span
                className="w-full rounded-t-[1px] bg-primary/45"
                style={{
                  height: hour.count === 0
                    ? '1px'
                    : `${Math.max(5, (hour.count / peak) * 100)}%`,
                }}
              />
            </div>
          ))}
        </div>

        <div className="mt-1 flex justify-between text-[10px] tabular-nums text-muted-foreground/60">
          <span>0</span>
          <span>6</span>
          <span>12</span>
          <span>18</span>
          <span>23</span>
        </div>
      </div>
    </section>
  )
}
