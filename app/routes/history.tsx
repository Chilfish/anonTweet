import type { VisitedItem, VisitedType } from '~/lib/visited'
import { ArrowLeftIcon, HistoryIcon, SearchIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { HistoryList } from '~/components/history/HistoryList'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '~/components/ui/empty'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '~/components/ui/input-group'
import { Skeleton } from '~/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group'
import { buildMeta } from '~/lib/seo'
import { loadVisitedHistory } from '~/lib/storage/visited'
import { useVisitedStore } from '~/lib/stores/visited'
import { filterVisited } from '~/lib/visited'

const TYPE_OPTIONS: { value: VisitedType | 'all', label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'tweet', label: '推文' },
  { value: 'article', label: '长文' },
  { value: 'ig', label: 'IG' },
]

function parseType(value: string | null): VisitedType | 'all' {
  return value === 'tweet' || value === 'article' || value === 'ig'
    ? value
    : 'all'
}

export function meta() {
  return buildMeta({
    title: '浏览历史 | Anon Tweet',
    description: '本机保存的推文、长文与 Instagram 浏览记录。',
    noindex: true,
  })
}

function HistorySkeleton() {
  return (
    <div className="flex w-full flex-col gap-3">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-1 py-3">
          <Skeleton className="size-12 shrink-0 rounded-md" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const type = parseType(searchParams.get('type'))

  const [input, setInput] = useState(q)
  const [items, setItems] = useState<VisitedItem[] | null>(null)

  const removeRecord = useVisitedStore(state => state.remove)
  const clearRecords = useVisitedStore(state => state.clear)

  useEffect(() => {
    let cancelled = false
    void loadVisitedHistory().then((records) => {
      if (!cancelled)
        setItems(records)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // 同步 URL 中的 q 到输入框（回退 / 直接访问带参数链接）
  useEffect(() => {
    setInput(q)
  }, [q])

  // 输入 250ms 后再写 URL，避免每个击键都产生一条历史
  useEffect(() => {
    if (input === q)
      return
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (input.trim())
          next.set('q', input.trim())
        else
          next.delete('q')
        return next
      }, { replace: true })
    }, 250)
    return () => clearTimeout(timer)
  }, [input, q, setSearchParams])

  const changeType = (value: VisitedType | 'all') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === 'all')
        next.delete('type')
      else
        next.set('type', value)
      return next
    }, { replace: true })
  }

  const filtered = useMemo(
    () => filterVisited(items ?? [], { q: input, type }),
    [items, input, type],
  )

  const handleRemove = (key: string) => {
    removeRecord(key)
    setItems(prev => prev?.filter(item => `${item.type}:${item.id}` !== key) ?? prev)
  }

  const handleClear = () => {
    clearRecords()
    setItems([])
  }

  const isLoading = items === null

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="返回首页"
          render={<Link to="/" />}
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <h2 className="text-lg font-semibold">浏览历史</h2>
        {!isLoading && (
          <span className="text-xs tabular-nums text-muted-foreground">
            {filtered.length}
            {' '}
            条
          </span>
        )}
        {!isLoading && items.length > 0 && (
          <div className="ml-auto">
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="ghost" size="sm" className="text-muted-foreground" />}
              >
                清空
              </AlertDialogTrigger>
              <AlertDialogPopup>
                <AlertDialogHeader>
                  <AlertDialogTitle>清空浏览历史</AlertDialogTitle>
                  <AlertDialogDescription>
                    本机保存的浏览记录与详情缓存都会被删除，无法恢复。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogClose render={<Button variant="secondary" />}>
                    取消
                  </AlertDialogClose>
                  <AlertDialogClose
                    render={<Button variant="destructive" />}
                    onClick={handleClear}
                  >
                    清空
                  </AlertDialogClose>
                </AlertDialogFooter>
              </AlertDialogPopup>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <InputGroup className="sm:max-w-xs">
          <InputGroupAddon align="inline-start">
            <SearchIcon className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            value={input}
            onChange={event => setInput(event.target.value)}
            placeholder="搜索标题或摘要"
            aria-label="搜索浏览历史"
            autoComplete="off"
            enterKeyHint="search"
          />
        </InputGroup>

        <ToggleGroup
          value={[type]}
          onValueChange={(value) => {
            const next = value[0]
            if (next)
              changeType(parseType(next))
          }}
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
        >
          {TYPE_OPTIONS.map(option => (
            <ToggleGroupItem key={option.value} value={option.value}>
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {isLoading && <HistorySkeleton />}

      {!isLoading && items.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HistoryIcon />
            </EmptyMedia>
            <EmptyTitle>还没有浏览记录</EmptyTitle>
            <EmptyDescription>
              打开过的推文、长文与 Instagram 帖子会保存在本机，下一次从这里继续。
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {!isLoading && items.length > 0 && filtered.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon />
            </EmptyMedia>
            <EmptyTitle>没有匹配的记录</EmptyTitle>
            <EmptyDescription>换个关键词，或把类型切回「全部」。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {!isLoading && filtered.length > 0 && (
        <HistoryList items={filtered} onRemove={handleRemove} />
      )}
    </div>
  )
}
