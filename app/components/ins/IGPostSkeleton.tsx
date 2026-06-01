import { Skeleton } from '~/components/ui/skeleton'
import { cn } from '~/lib/utils'
import { IGActionBar } from './IGActionBar'
import InsLogo from './InsLogo'

/**
 * Instagram 帖子骨架屏。
 *
 * 逐层还原 InstagramPostCard 结构：
 * ```
 * [头像] [用户名]        [InsLogo]
 * ┌──────┬──────┬──────┐
 * │  ██  │  ██  │  ██  │
 * ├──────┼──────┼──────┤
 * │  ██  │  ██  │  ██  │
 * └──────┴──────┴──────┘
 *  ❤️  💬  ✈          🔖
 *  1 小时前
 *  @username
 *  ██████████████
 *  ████████████
 * ```
 */
export function IGPostSkeleton({ className }: { className?: string }) {
  return (
    <article
      className={cn(
        'w-full max-w-150 mx-auto',
        'bg-card',
        'rounded-sm',
        'border border-border/20',
        'pb-3',
        'animate-pulse',
        className,
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        {/* Avatar */}
        <Skeleton className="size-8 rounded-full shrink-0" />
        {/* Name + verified */}
        <div className="flex-1 min-w-0">
          <Skeleton className="h-3.5 w-28 rounded" />
        </div>
        {/* InsLogo placeholder */}
        <InsLogo className="h-8 w-auto text-foreground/80" />
      </div>

      {/* ── Media Grid (3×2) ── */}
      <div className="flex flex-col gap-[1px] bg-muted/20">
        {[0, 1].map(row => (
          <div key={row} className="flex gap-[1px]">
            {[0, 1, 2].map(col => (
              <Skeleton
                key={col}
                className="flex-1 aspect-square rounded-none"
              />
            ))}
          </div>
        ))}
      </div>

      {/* ── Action Bar ── */}
      <IGActionBar />

      {/* ── Timestamp ── */}
      <div className="px-4 pb-1">
        <Skeleton className="h-3 w-16 rounded" />
      </div>

      {/* ── Caption ── */}
      <div className="px-4 pt-0 pb-3 space-y-1.5">
        <Skeleton className="h-3.5 w-20 rounded" />
        <Skeleton className="h-3.5 w-full rounded" />
        <Skeleton className="h-3.5 w-3/4 rounded" />
      </div>
    </article>
  )
}
