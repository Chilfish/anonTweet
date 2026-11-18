import { Skeleton } from '~/components/ui/skeleton'

/** 首页骨架屏：输入卡片 + 最近查看列表。 */
export function HomePageSkeleton() {
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-5 w-24 rounded" />
          <Skeleton className="h-4 w-56 rounded opacity-70" />
        </div>

        <Skeleton className="mt-4 h-9 w-full rounded-md" />
        <Skeleton className="mt-4 h-9 w-full rounded-md" />

        <div className="mt-6 space-y-2">
          <Skeleton className="h-3.5 w-20 rounded" />
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-3.5 w-[85%] rounded opacity-70" />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
      </div>

      <div className="w-full max-w-md">
        <div className="mb-1 flex items-center justify-between px-2">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-3 w-8 rounded" />
        </div>
        <div className="flex flex-col">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-lg px-2 py-2">
              <Skeleton className="size-9 shrink-0 rounded-md" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-1/3 rounded" />
                <Skeleton className="h-3 w-2/3 rounded opacity-70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
