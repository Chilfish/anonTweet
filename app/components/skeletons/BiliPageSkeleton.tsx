import { Skeleton } from '~/components/ui/skeleton'

/** Bilibili 动态发布页骨架屏：表单卡片。 */
export function BiliPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border/60 bg-card">
      <div className="p-6">
        <Skeleton className="h-6 w-48 rounded" />
      </div>

      <div className="space-y-6 p-6 pt-0">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        ))}
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-20 rounded" />
          <Skeleton className="h-[120px] w-full rounded-md" />
        </div>
      </div>

      <div className="flex items-center gap-3 p-6 pt-0">
        <Skeleton className="h-9 w-20 rounded-md" />
        <Skeleton className="ml-auto h-9 w-24 rounded-md" />
      </div>
    </div>
  )
}
