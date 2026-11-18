import type { VisitedItem } from '~/lib/visited'
import { XIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  formatVisitedTime,
  visitedAuthorLabel,
  visitedHref,
  visitedKey,
} from '~/lib/visited'

const TYPE_LABEL = {
  tweet: '推文',
  ig: 'IG',
  article: '长文',
} as const

/** 表格视图：高密度浏览，移动端横向滚动 */
export function HistoryTable({
  items,
  onRemove,
  now = Date.now(),
}: {
  items: VisitedItem[]
  onRemove?: (key: string) => void
  now?: number
}) {
  if (!items.length)
    return null

  return (
    <Table className="min-w-[620px]">
      <TableHeader>
        <TableRow>
          <TableHead className="pl-1">内容</TableHead>
          <TableHead>作者</TableHead>
          <TableHead>类型</TableHead>
          <TableHead className="text-right">浏览</TableHead>
          <TableHead className="text-right">最近</TableHead>
          <TableHead className="w-8 pr-1" />
        </TableRow>
      </TableHeader>

      <TableBody>
        {items.map(item => (
          <TableRow key={visitedKey(item)}>
            <TableCell className="max-w-[22rem] whitespace-normal pl-1">
              <Link
                to={visitedHref(item)}
                className="block truncate text-sm font-medium hover:underline"
                title={item.title}
              >
                {item.title || TYPE_LABEL[item.type]}
              </Link>
              {item.snippet && (
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {item.snippet}
                </span>
              )}
            </TableCell>

            <TableCell className="max-w-36 truncate text-xs text-muted-foreground">
              {visitedAuthorLabel(item)}
            </TableCell>

            <TableCell>
              <Badge variant="outline" size="sm">
                {TYPE_LABEL[item.type]}
              </Badge>
            </TableCell>

            <TableCell className="text-right text-xs tabular-nums">
              {item.visits ?? 1}
            </TableCell>

            <TableCell
              className="text-right text-xs tabular-nums text-muted-foreground"
              title={new Date(item.ts).toLocaleString('zh-CN')}
            >
              {formatVisitedTime(item.ts, now)}
            </TableCell>

            <TableCell className="pr-1">
              {onRemove && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground/40 hover:text-destructive"
                  aria-label={`移除 ${item.title || TYPE_LABEL[item.type]}`}
                  onClick={() => onRemove(visitedKey(item))}
                >
                  <XIcon />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
