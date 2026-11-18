import type { VisitedItem } from '~/lib/visited'
import { FileText, Images, MessageCircle } from 'lucide-react'
import { Link } from 'react-router'
import { MediaImage } from '~/components/ui/media'
import { Skeleton } from '~/components/ui/skeleton'
import { useProxyMedia } from '~/lib/stores/appConfig'
import {
  formatVisitedTime,
  HOME_RECENT_LIMIT,
  visitedHref,
  visitedKey,
} from '~/lib/visited'

const TYPE_ICON = {
  tweet: MessageCircle,
  ig: Images,
  article: FileText,
} as const

const TYPE_LABEL = {
  tweet: '推文',
  ig: 'Instagram',
  article: '长文',
} as const

function VisitedRow({ item }: { item: VisitedItem }) {
  const proxyMedia = useProxyMedia()
  const Icon = TYPE_ICON[item.type]

  return (
    <Link
      to={visitedHref(item)}
      className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40"
    >
      <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/60">
        {item.image
          ? (
              <MediaImage
                src={proxyMedia(item.image)}
                alt=""
                containerClassName="size-full"
                loading="lazy"
              />
            )
          : <Icon className="size-4 text-muted-foreground/70" aria-hidden />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          {item.image && (
            <Icon className="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
          )}
          <span className="truncate text-[13px] font-medium">
            {item.title || TYPE_LABEL[item.type]}
          </span>
        </span>
        {item.snippet && (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {item.snippet}
          </span>
        )}
      </span>

      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/50">
        {formatVisitedTime(item.ts)}
      </span>
    </Link>
  )
}

function VisitedRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2">
      <Skeleton className="size-9 shrink-0 rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-1/3 rounded" />
        <Skeleton className="h-3 w-2/3 rounded opacity-70" />
      </div>
    </div>
  )
}

/** 最近查看：首页回访入口，只保留最近几条；完整记录在 /history */
export function RecentVisited({
  items,
  loading = false,
  allHref = '/history',
}: {
  items: VisitedItem[]
  /** IndexedDB 水合未完成：占住列表高度，避免首帧空白后列表再弹出来 */
  loading?: boolean
  allHref?: string
}) {
  if (!loading && !items.length)
    return null

  return (
    <section className="w-full max-w-md mt-4" aria-busy={loading}>
      <div className="mb-1 flex items-center justify-between px-2">
        <h2 className="text-xs font-medium text-muted-foreground">最近查看</h2>
        {loading
          ? <Skeleton className="h-3 w-8 rounded" />
          : (
              <Link
                to={allHref}
                className="text-[11px] text-muted-foreground/60 transition-colors hover:text-foreground"
              >
                全部
              </Link>
            )}
      </div>
      <ul className="flex flex-col">
        {loading
          ? Array.from({ length: HOME_RECENT_LIMIT }, (_, index) => (
              <li key={index}>
                <VisitedRowSkeleton />
              </li>
            ))
          : items.map(item => (
              <li key={visitedKey(item)}>
                <VisitedRow item={item} />
              </li>
            ))}
      </ul>
    </section>
  )
}
