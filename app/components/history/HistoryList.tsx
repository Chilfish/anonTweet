import type { HistoryGroup } from './types'
import type { VisitedItem } from '~/lib/visited'
import { FileText, Images, MessageCircle, XIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { MediaImage } from '~/components/ui/media'
import { useProxyMedia } from '~/lib/stores/appConfig'
import {
  formatVisitedTime,
  groupVisitedByDay,
  visitedAuthorLabel,
  visitedHref,
  visitedKey,
} from '~/lib/visited'
import { groupVisitedByAuthor } from '~/lib/visited-analytics'

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
  now,
  showAuthor,
}: {
  item: VisitedItem
  onRemove?: (key: string) => void
  now: number
  showAuthor: boolean
}) {
  const proxyMedia = useProxyMedia()
  const Icon = TYPE_ICON[item.type]
  const key = visitedKey(item)
  const visits = item.visits ?? 1

  return (
    <li className="flex items-center gap-1 border-b border-border/40 last:border-b-0">
      <Link
        to={visitedHref(item)}
        className="group flex min-w-0 flex-1 items-center gap-3 rounded-md py-2.5 pl-1 pr-1 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
      >
        <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/60">
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
            <span className="sr-only">{TYPE_LABEL[item.type]}</span>
            <span className="break-words text-sm font-medium">
              {item.title || TYPE_LABEL[item.type]}
            </span>
          </span>

          {item.snippet && (
            <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
              {item.snippet}
            </span>
          )}

          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground/70">
            {showAuthor && (
              <span className="max-w-52 truncate">{visitedAuthorLabel(item)}</span>
            )}
            {visits > 1 && <span className="tabular-nums">{`${visits} 次`}</span>}
          </span>
        </span>

        <span
          className="shrink-0 self-start pt-0.5 text-[11px] tabular-nums text-muted-foreground/60"
          title={new Date(item.ts).toLocaleString('zh-CN')}
        >
          {formatVisitedTime(item.ts, now)}
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

interface NormalizedGroup {
  key: string
  label: string
  meta?: string
  items: VisitedItem[]
}

/** /history 列表：按日期或作者分组，行内提供移除动作 */
export function HistoryList({
  items,
  groupBy,
  onRemove,
  now = Date.now(),
}: {
  items: VisitedItem[]
  groupBy: HistoryGroup
  onRemove?: (key: string) => void
  now?: number
}) {
  if (!items.length)
    return null

  const groups: NormalizedGroup[] = groupBy === 'author'
    ? groupVisitedByAuthor(items).map(group => ({
        key: group.key,
        label: group.label,
        meta: `${group.records} 条 · ${group.visits} 次`,
        items: group.items,
      }))
    : groupVisitedByDay(items, now).map(group => ({
        key: group.key,
        label: group.label,
        items: group.items,
      }))

  return (
    <div className="flex w-full flex-col gap-5">
      {groups.map(group => (
        <section key={group.key}>
          <div className="flex items-baseline justify-between gap-2 px-1 pb-1">
            <h4 className="text-xs font-medium text-muted-foreground">
              {group.label}
            </h4>
            {group.meta && (
              <span className="text-[10px] tabular-nums text-muted-foreground/60">
                {group.meta}
              </span>
            )}
          </div>
          <ul className="flex flex-col">
            {group.items.map(item => (
              <HistoryRow
                key={visitedKey(item)}
                item={item}
                onRemove={onRemove}
                now={now}
                showAuthor={groupBy === 'date'}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
