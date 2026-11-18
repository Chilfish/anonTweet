import { Skeleton } from '~/components/ui/skeleton'
import { cn } from '~/lib/utils'

interface PageToolbarSkeletonProps {
  /** 右侧动作按钮占位数量（快拍页为 0，只有返回） */
  actions?: number
  className?: string
}

/** 页面顶部操作栏占位：对齐 TweetHeader / IGHeader 的「返回 + 右侧动作」。 */
export function PageToolbarSkeleton({
  actions = 3,
  className,
}: PageToolbarSkeletonProps) {
  return (
    <div
      className={cn(
        'mb-4 flex w-full items-center justify-between gap-2 px-1 py-2 sm:mb-6 sm:px-0',
        className,
      )}
    >
      <Skeleton className="h-8 w-16 rounded-md" />
      {actions > 0 && (
        <div className="flex items-center gap-1 sm:gap-2">
          {Array.from({ length: actions }, (_, index) => (
            <Skeleton key={index} className="size-8 rounded-md" />
          ))}
        </div>
      )}
    </div>
  )
}
