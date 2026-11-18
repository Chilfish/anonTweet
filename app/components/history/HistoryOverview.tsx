import type { VisitedStats } from '~/lib/visited-analytics'

const numberFormat = new Intl.NumberFormat('zh-CN')

/** 无卡片的总览条：大数字 + 分隔线，信息密度靠排版而不是容器 */
export function HistoryOverview({ stats }: { stats: VisitedStats }) {
  const cells = [
    { label: '条记录', value: stats.records },
    { label: '次浏览', value: stats.visits },
    { label: '位作者', value: stats.authors },
    { label: '天活跃', value: stats.activeDays },
  ]

  return (
    <section
      aria-label="浏览总览"
      className="flex min-w-0 flex-col gap-3 border-b border-border/50 pb-4"
    >
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {cells.map(cell => (
          <div key={cell.label} className="flex min-w-0 flex-col gap-0.5">
            <dd className="text-[26px] font-semibold leading-none tracking-tight tabular-nums">
              {numberFormat.format(cell.value)}
            </dd>
            <dt className="text-xs text-muted-foreground">{cell.label}</dt>
          </div>
        ))}
      </dl>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {`当前连续 ${stats.currentStreak} 天 · 最长 ${stats.longestStreak} 天 · 活跃日均 ${stats.averagePerActiveDay.toFixed(1)} 次 · 推文 ${stats.byType.tweet} · 长文 ${stats.byType.article} · Instagram ${stats.byType.ig}`}
      </p>
    </section>
  )
}
