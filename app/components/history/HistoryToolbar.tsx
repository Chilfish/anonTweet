import type { HistoryGroup, HistoryView } from './types'
import type { VisitedRange, VisitedSort, VisitedType } from '~/lib/visited'
import type { VisitedAuthorStat } from '~/lib/visited-analytics'
import { ListIcon, SearchIcon, Table2Icon, XIcon } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '~/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group'

export interface HistoryQuery {
  q: string
  type: VisitedType | 'all'
  range: VisitedRange
  author: string
  view: HistoryView
  group: HistoryGroup
  sort: VisitedSort
}

const TYPE_OPTIONS: { value: VisitedType | 'all', label: string }[] = [
  { value: 'all', label: '全部类型' },
  { value: 'tweet', label: '推文' },
  { value: 'article', label: '长文' },
  { value: 'ig', label: 'Instagram' },
]

const RANGE_OPTIONS: { value: VisitedRange, label: string }[] = [
  { value: 'all', label: '全部时间' },
  { value: 'today', label: '今天' },
  { value: '7d', label: '近 7 天' },
  { value: '30d', label: '近 30 天' },
]

const GROUP_OPTIONS: { value: HistoryGroup, label: string }[] = [
  { value: 'date', label: '按日期' },
  { value: 'author', label: '按作者' },
]

const SORT_OPTIONS: { value: VisitedSort, label: string }[] = [
  { value: 'recent', label: '最近浏览' },
  { value: 'visits', label: '浏览最多' },
  { value: 'oldest', label: '最早浏览' },
]

/** 轻量筛选胶囊：无边框、紧凑，横向滚动 */
function FilterSelect({
  value,
  items,
  ariaLabel,
  onChange,
}: {
  value: string
  items: { value: string, label: string }[]
  ariaLabel: string
  onChange: (value: string) => void
}) {
  return (
    <Select
      value={value}
      items={items}
      onValueChange={(next) => {
        if (next)
          onChange(next)
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className="h-7 min-h-0 w-auto min-w-0 max-w-44 shrink-0 gap-1 rounded-full border-transparent bg-muted/55 px-2.5 text-xs shadow-none before:hidden hover:bg-muted focus-visible:ring-1 sm:min-h-0 sm:text-xs [&_svg]:size-3.5 [&_svg]:opacity-60"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** 记录区工具栏：搜索 + 轻量筛选胶囊 + 视图切换 */
export function HistoryToolbar({
  query,
  authors,
  isFiltered,
  onChange,
  onClear,
}: {
  query: HistoryQuery
  authors: VisitedAuthorStat[]
  isFiltered: boolean
  onChange: (patch: Partial<HistoryQuery>) => void
  onClear: () => void
}) {
  const authorOptions = [
    { value: '__all__', label: '全部作者' },
    ...authors.map(author => ({
      value: author.key,
      label: `${author.label} · ${author.visits}`,
    })),
  ]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <InputGroup className="min-w-0 flex-1">
          <InputGroupAddon align="inline-start">
            <SearchIcon className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            value={query.q}
            onChange={event => onChange({ q: event.target.value })}
            placeholder="搜索标题、摘要或作者"
            aria-label="搜索浏览历史"
            autoComplete="off"
            enterKeyHint="search"
          />
          {query.q && (
            <InputGroupAddon align="inline-end">
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground"
                aria-label="清除搜索"
                onClick={() => onChange({ q: '' })}
              >
                <XIcon />
              </Button>
            </InputGroupAddon>
          )}
        </InputGroup>

        <ToggleGroup
          value={[query.view]}
          onValueChange={(values) => {
            const next = values[0]
            if (next)
              onChange({ view: next as HistoryView })
          }}
          size="sm"
          aria-label="视图"
          className="shrink-0 rounded-full bg-muted/50 p-0.5"
        >
          <ToggleGroupItem value="list" aria-label="列表视图" title="列表">
            <ListIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="表格视图" title="表格">
            <Table2Icon />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterSelect
            value={query.author || '__all__'}
            items={authorOptions}
            ariaLabel="作者筛选"
            onChange={value => onChange({
              author: value === '__all__'
                ? ''
                : value,
            })}
          />
          <FilterSelect
            value={query.range}
            items={RANGE_OPTIONS}
            ariaLabel="时间范围"
            onChange={value => onChange({ range: value as VisitedRange })}
          />
          <FilterSelect
            value={query.type}
            items={TYPE_OPTIONS}
            ariaLabel="内容类型"
            onChange={value => onChange({ type: value as VisitedType | 'all' })}
          />
          {query.view === 'list'
            ? (
                <FilterSelect
                  value={query.group}
                  items={GROUP_OPTIONS}
                  ariaLabel="分组方式"
                  onChange={value => onChange({ group: value as HistoryGroup })}
                />
              )
            : (
                <FilterSelect
                  value={query.sort}
                  items={SORT_OPTIONS}
                  ariaLabel="排序方式"
                  onChange={value => onChange({ sort: value as VisitedSort })}
                />
              )}
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 text-[11px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            清除
          </button>
        )}
      </div>
    </div>
  )
}
