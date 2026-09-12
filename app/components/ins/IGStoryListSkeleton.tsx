import { Skeleton } from '~/components/ui/skeleton'
import { cn } from '~/lib/utils'

/** 占位格数（3 列 × 4 行），与实际网格列数断点同形。 */
const CELL_COUNT = 12

/**
 * 快拍列表骨架屏。
 *
 * 与加载后的网格布局同形（同样的列数断点），避免数据到达时整页跳动。
 * 由 `ins.tsx` 在 `isIGStoryLikeId()` 命中时替代帖子的 `IGPostSkeleton`。
 */
export function IGStoryListSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      <div className="flex flex-wrap items-center gap-2" data-slot="story-skeleton-toolbar">
        <Skeleton className="h-5 w-20 rounded" />
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>

      <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-5">
        {Array.from({ length: CELL_COUNT }, (_, i) => (
          <Skeleton key={i} className="aspect-square rounded-none" data-slot="story-skeleton-cell" />
        ))}
      </div>
    </div>
  )
}
