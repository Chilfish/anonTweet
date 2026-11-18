import { Skeleton } from '~/components/ui/skeleton'
import { PageToolbarSkeleton } from './PageToolbarSkeleton'

const BODY_LINES = [
  'w-[95%]',
  'w-[88%]',
  'w-[92%]',
  'w-[70%]',
  'w-[96%]',
  'w-[84%]',
  'w-[90%]',
  'w-[62%]',
]

/** X 长文阅读页骨架屏：工具栏 + 标题 / 作者 / 封面 / 正文块。 */
export function ArticlePageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl px-0 py-6">
      <PageToolbarSkeleton actions={3} />

      <article className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
        <header className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-3/4 rounded-md" />
            <Skeleton className="h-7 w-1/2 rounded-md" />
          </div>

          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-32 rounded" />
              <Skeleton className="h-3 w-40 rounded opacity-70" />
            </div>
          </div>

          <Skeleton className="aspect-[2/1] w-full rounded-lg opacity-70" />
        </header>

        <div className="my-6 h-px w-full bg-border/60" />

        <div className="space-y-2.5">
          {BODY_LINES.map((width, index) => (
            <Skeleton key={index} className={`h-4 ${width} rounded`} />
          ))}
        </div>
      </article>
    </div>
  )
}
