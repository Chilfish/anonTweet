import { Skeleton } from '~/components/ui/skeleton'
import { cn } from '~/lib/utils'

/** 占位格数（12 格，手机 2 列 / 桌面 3 列）。 */
const CELL_COUNT = 12

/**
 * 快拍列表骨架屏。
 *
 * 与加载后的相册卡片同形：身份头 + 条数工具栏 + 3:4 圆角竖版网格，
 * 列数断点一致，避免数据到达时整张卡片跳动。
 */
export function IGStoryListSkeleton({ className }: { className?: string }) {
  return (
    <article
      data-slot="story-album"
      className={cn(
        'mx-auto w-full max-w-[600px] overflow-hidden rounded-2xl border border-border/60 bg-card',
        className,
      )}
    >
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-3 w-24 rounded opacity-70" />
        </div>
        <Skeleton className="size-8 rounded" />
      </div>

      <div
        data-slot="story-skeleton-toolbar"
        className="flex items-center justify-between gap-2 px-4 pb-2"
      >
        <Skeleton className="h-3 w-16 rounded" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-14 rounded-md opacity-70" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 px-3 pb-3 sm:grid-cols-3">
        {Array.from({ length: CELL_COUNT }, (_, i) => (
          <Skeleton
            key={i}
            className="aspect-[3/4] rounded-lg"
            data-slot="story-skeleton-cell"
          />
        ))}
      </div>
    </article>
  )
}
