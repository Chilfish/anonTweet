import type { VisitedItem } from '~/lib/visited'
import { FileText, Images, MessageCircle, XIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { MediaImage } from '~/components/ui/media'
import { useProxyMedia } from '~/lib/stores/appConfig'
import {
  formatVisitedTime,
  groupVisitedByDay,
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

function HistoryRow({
  item,
  onRemove,
}: {
  item: VisitedItem
  onRemove?: (key: string) => void
}) {
  const proxyMedia = useProxyMedia()
  const Icon = TYPE_ICON[item.type]
  const key = visitedKey(item)

  return (
    <li className="flex items-center gap-1 border-b border-border/40 last:border-b-0">
      <Link
        to={visitedHref(item)}
        className="group flex min-w-0 flex-1 items-center gap-3 py-3 pl-1 pr-2"
      >
        <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/60">
          {item.image
            ? (
                <MediaImage
                  src={proxyMedia(item.image)}
                  alt=""
                  containerClassName="size-full"
                  loading="lazy"
                />
              )
            : <Icon className="size-4 text-muted-foreground/60" aria-hidden />}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <Icon className="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
            <span className="break-words text-sm font-medium">
              {item.title || TYPE_LABEL[item.type]}
            </span>
          </span>
          {item.snippet && (
            <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
              {item.snippet}
            </span>
          )}
        </span>

        <span className="shrink-0 self-start pt-0.5 text-[11px] tabular-nums text-muted-foreground/60">
          {formatVisitedTime(item.ts)}
        </span>
      </Link>

      {onRemove && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground/40 hover:text-destructive"
          aria-label={`移除 ${item.title || TYPE_LABEL[item.type]}`}
          onClick={() => onRemove(key)}
        >
          <XIcon className="size-4" />
        </Button>
      )}
    </li>
  )
}

/** /history 的列表：按本地日期分组，行内提供移除动作 */
export function HistoryList({
  items,
  onRemove,
  now,
}: {
  items: VisitedItem[]
  onRemove?: (key: string) => void
  now?: number
}) {
  if (!items.length)
    return null

  const groups = groupVisitedByDay(items, now)

  return (
    <div className="flex w-full flex-col gap-5">
      {groups.map(group => (
        <section key={group.label}>
          <h3 className="px-2 pb-1 text-xs font-medium text-muted-foreground">
            {group.label}
          </h3>
          <ul className="flex flex-col">
            {group.items.map(item => (
              <HistoryRow key={visitedKey(item)} item={item} onRemove={onRemove} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
