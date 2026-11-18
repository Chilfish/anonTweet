import { Skeleton } from '~/components/ui/skeleton'

/** 浏览历史内容区骨架屏（放在页面卡片内）。 */
export function HistorySkeleton() {
  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-3 border-y border-border/60 py-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
        <Skeleton className="h-3 w-2/3" />
      </div>

      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-24 w-full" />

      <div className="flex flex-col gap-3 border-t border-border/60 pt-5">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-3 px-1 py-2.5">
            <Skeleton className="size-10 shrink-0 rounded-md" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** 浏览历史整页骨架屏：标题行 + 卡片外壳 + 内容区。 */
export function HistoryPageSkeleton() {
  return (
    <div className="flex w-full flex-col gap-5 px-3 sm:px-0">
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 shrink-0 rounded-md" />
        <Skeleton className="h-5 w-24 rounded" />
      </div>

      <div className="flex min-w-0 max-w-full flex-col gap-5 rounded-2xl border border-border/50 bg-card/70 p-4 sm:p-5">
        <HistorySkeleton />
      </div>
    </div>
  )
}
