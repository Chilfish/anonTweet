import { Skeleton } from '~/components/ui/skeleton'
import { cn } from '~/lib/utils'

/**
 * Instagram 帖子骨架屏。
 *
 * 与 `InstagramPostCard` 同构：身份头 / 媒体 / 互动栏 / 时间 / caption。
 * 媒体用一块连续的 3:2 占位（多图卡片的整体比例），避免 6 个格子各自闪烁；
 * 动画只交给 `Skeleton`，卡片本身不再叠加 `animate-pulse`。
 */
export function IGPostSkeleton({ className }: { className?: string }) {
  return (
    <article
      className={cn(
        'w-full max-w-150 mx-auto overflow-hidden',
        'bg-card rounded-sm border border-border/20',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-3.5 w-28 rounded" />
        </div>
        <Skeleton className="h-7 w-20 rounded-md opacity-60" />
      </div>

      {/* Media — 连续占位，不再拆成 6 个闪烁格 */}
      <Skeleton className="aspect-[3/2] w-full rounded-none" />

      {/* Action bar */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          {[0, 1, 2].map(index => (
            <Skeleton key={index} className="size-6 rounded-md" />
          ))}
        </div>
        <Skeleton className="size-6 rounded-md" />
      </div>

      {/* Timestamp + caption */}
      <div className="space-y-2 px-4 pt-1 pb-3">
        <Skeleton className="h-2.5 w-14 rounded opacity-60" />
        <Skeleton className="h-3.5 w-24 rounded" />
        <Skeleton className="h-3.5 w-[92%] rounded" />
        <Skeleton className="h-3.5 w-[64%] rounded" />
      </div>
    </article>
  )
}
