import { Skeleton } from '~/components/ui/skeleton'
import { TweetSkeleton } from '~/lib/react-tweet'

/** 搜索页骨架屏：搜索栏卡片 + 结果标题 + 两条推文。 */
export function SearchPageSkeleton() {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[600px] flex-col gap-4 px-3 sm:px-0">
      <div className="rounded-2xl border border-border/60 bg-card p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16 shrink-0 rounded-md" />
          <Skeleton className="h-9 flex-1 rounded-md" />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2 border-b border-border/60 pb-2">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-3 w-16 rounded opacity-70" />
        </div>
        <TweetSkeleton />
        <TweetSkeleton />
      </div>
    </div>
  )
}
