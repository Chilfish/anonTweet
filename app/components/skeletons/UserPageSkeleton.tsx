import { Skeleton } from '~/components/ui/skeleton'
import { TweetSkeleton } from '~/lib/react-tweet'

/** 用户页骨架屏：返回 + 资料卡 + 时间线标题 + 两条推文。 */
export function UserPageSkeleton() {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[600px] flex-col gap-4 px-3 sm:px-0">
      <div className="flex w-full">
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>

      <article className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <Skeleton className="aspect-[3/1] w-full rounded-none opacity-60" />

        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <Skeleton className="-mt-10 size-20 rounded-full border-4 border-card bg-muted sm:-mt-12 sm:size-24" />

          <div className="mt-3 space-y-2">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-3.5 w-24 rounded opacity-70" />
          </div>

          <div className="mt-3 space-y-1.5">
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-4/5 rounded" />
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            <Skeleton className="h-3.5 w-20 rounded" />
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-3.5 w-16 rounded" />
          </div>
        </div>
      </article>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2 border-b border-border/60 pb-2">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-3 w-20 rounded opacity-70" />
        </div>
        <TweetSkeleton />
        <TweetSkeleton />
      </section>
    </div>
  )
}
