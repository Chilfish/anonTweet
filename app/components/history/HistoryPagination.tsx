import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

const PAGE_SIZE_OPTIONS = [
  { value: '20', label: '20 条/页' },
  { value: '50', label: '50 条/页' },
  { value: '100', label: '100 条/页' },
]

/** 记录分页：范围 / 每页条数 / 翻页，只出现在列表上方 */
export function HistoryPagination({
  page,
  pageCount,
  total,
  pageStart,
  pageEnd,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  pageCount: number
  total: number
  pageStart: number
  pageEnd: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}) {
  if (total === 0)
    return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="tabular-nums">
          {`${pageStart}–${pageEnd} / ${total}`}
        </span>

        <Select
          value={String(pageSize)}
          items={PAGE_SIZE_OPTIONS}
          onValueChange={(value) => {
            if (value)
              onPageSizeChange(Number(value))
          }}
        >
          <SelectTrigger
            size="sm"
            aria-label="每页条数"
            className="h-7 min-h-0 w-auto min-w-0 gap-1 rounded-full border-transparent bg-muted/55 px-2.5 text-xs shadow-none before:hidden hover:bg-muted focus-visible:ring-1 sm:min-h-0 sm:text-xs [&_svg]:size-3.5 [&_svg]:opacity-60"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="第一页"
          className="text-muted-foreground max-sm:hidden"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
        >
          <ChevronsLeftIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="上一页"
          className="text-muted-foreground"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeftIcon />
        </Button>
        <span className="min-w-14 text-center text-xs tabular-nums">
          {`${page} / ${pageCount}`}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="下一页"
          className="text-muted-foreground"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRightIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="最后一页"
          className="text-muted-foreground max-sm:hidden"
          disabled={page >= pageCount}
          onClick={() => onPageChange(pageCount)}
        >
          <ChevronsRightIcon />
        </Button>
      </div>
    </div>
  )
}
