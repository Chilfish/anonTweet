import { Skeleton } from '~/components/ui/skeleton'
import { TweetSkeleton } from '~/lib/react-tweet'

/** Twitter 列表页骨架屏：返回 + 列表 ID 表单 + 两条推文。 */
export function ListPageSkeleton() {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[600px] flex-col gap-4 px-3 sm:px-0">
      <div className="flex w-full">
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>

      <section className="rounded-2xl border border-border/60 bg-card p-3 sm:p-4">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="mt-2 h-3 w-56 rounded opacity-70" />

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 w-full rounded-md sm:w-24" />
        </div>
      </section>

      <TweetSkeleton />
      <TweetSkeleton />
    </div>
  )
}
