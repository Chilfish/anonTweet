import { Skeleton } from '~/components/ui/skeleton'

/** 关于页骨架屏：标题 / 简介 + 分组信息卡片。 */
export function AboutPageSkeleton() {
  return (
    <article className="w-full min-w-0 max-w-2xl px-4 pb-2 sm:px-0">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 rounded-md" />
        <Skeleton className="h-4 w-full rounded opacity-70" />
        <Skeleton className="h-4 w-2/3 rounded opacity-70" />
      </div>

      <div className="mt-6 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="space-y-3 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded-sm opacity-70" />
              <Skeleton className="h-3.5 w-24 rounded" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-full rounded opacity-70" />
              <Skeleton className="h-3.5 w-5/6 rounded opacity-70" />
              <Skeleton className="h-3.5 w-2/3 rounded opacity-70" />
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}
