import type { VisitedItem } from '~/lib/visited'
import { FileText, Images, MessageCircle } from 'lucide-react'
import { Link } from 'react-router'
import { MediaImage } from '~/components/ui/media'
import { useProxyMedia } from '~/lib/stores/appConfig'
import { formatVisitedTime, visitedHref, visitedKey } from '~/lib/visited'

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

/** 最近查看：首页回访入口，只保留最近几条；完整记录在 /history */
export function RecentVisited({
  items,
  allHref = '/history',
}: {
  items: VisitedItem[]
  allHref?: string
}) {
  if (!items.length)
    return null

  return (
    <section className="w-full max-w-md mt-4">
      <div className="mb-1 flex items-center justify-between px-2">
        <h2 className="text-xs font-medium text-muted-foreground">最近查看</h2>
        <Link
          to={allHref}
          className="text-[11px] text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          全部
        </Link>
      </div>
      <ul className="flex flex-col">
        {items.map(item => (
          <li key={visitedKey(item)}>
            <VisitedRow item={item} />
          </li>
        ))}
      </ul>
    </section>
  )
}
