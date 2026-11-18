import { Skeleton } from '~/components/ui/skeleton'
import { cn } from '~/lib/utils'

/** 占位格数（3 列 × 3 行）。 */
const CELL_COUNT = 9

/**
 * 主页骨架屏：资料卡 + 3 列方形网格，与加载完成后的结构同形。
 */
export function IGProfileSkeleton({ className }: { className?: string }) {
  return (
    <div data-slot="ig-profile-skeleton" className={cn('mx-auto w-full max-w-[600px]', className)}>
      <article className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="flex items-start gap-4 px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
          <Skeleton className="size-16 shrink-0 rounded-full sm:size-20" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-24 rounded opacity-70" />
            <div className="mt-1 flex gap-6">
              <Skeleton className="h-8 w-12 rounded" />
              <Skeleton className="h-8 w-12 rounded" />
              <Skeleton className="h-8 w-12 rounded" />
            </div>
          </div>
        </div>
        <div className="space-y-1.5 px-4 pb-4 sm:px-5">
          <Skeleton className="h-3 w-full rounded opacity-70" />
          <Skeleton className="h-3 w-3/4 rounded opacity-70" />
        </div>
      </article>

      <div className="mt-3 grid grid-cols-3 gap-1 sm:gap-2">
        {Array.from({ length: CELL_COUNT }, (_, i) => (
          <Skeleton
            key={i}
            className="aspect-square rounded-md"
            data-slot="ig-profile-skeleton-cell"
          />
        ))}
      </div>
    </div>
  )
}
