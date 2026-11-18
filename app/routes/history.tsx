import type { HistoryQuery } from '~/components/history/HistoryToolbar'
import type { HistoryGroup, HistoryView } from '~/components/history/types'
import type {
  VisitedEvent,
  VisitedItem,
  VisitedRange,
  VisitedSort,
  VisitedType,
} from '~/lib/visited'
import {
  ArrowLeftIcon,
  DownloadIcon,
  HistoryIcon,
  SearchIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { HistoryActivity } from '~/components/history/HistoryActivity'
import { HistoryInsights } from '~/components/history/HistoryInsights'
import { HistoryList } from '~/components/history/HistoryList'
import { HistoryOverview } from '~/components/history/HistoryOverview'
import { HistoryPagination } from '~/components/history/HistoryPagination'
import { HistoryTable } from '~/components/history/HistoryTable'
import { HistoryToolbar } from '~/components/history/HistoryToolbar'
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/components/ui/empty'
import { Skeleton } from '~/components/ui/skeleton'
import { buildMeta } from '~/lib/seo'
import { loadVisitedHistory, loadVisitEvents } from '~/lib/storage/visited'
import { useVisitedStore } from '~/lib/stores/visited'
import {
  filterVisited,
  serializeVisitedExport,
  sortVisited,
  VISITED_LIMIT,
} from '~/lib/visited'
import {
  computeVisitedStats,
  topVisitedAuthors,
} from '~/lib/visited-analytics'

const PAGE_SIZES = [20, 50, 100] as const

function parseType(value: string | null): VisitedType | 'all' {
  return value === 'tweet' || value === 'article' || value === 'ig'
    ? value
    : 'all'
}

function parseRange(value: string | null): VisitedRange {
  return value === 'today' || value === '7d' || value === '30d'
    ? value
    : 'all'
}

function parseView(value: string | null): HistoryView {
  return value === 'table'
    ? 'table'
    : 'list'
}

function parseGroup(value: string | null): HistoryGroup {
  return value === 'author'
    ? 'author'
    : 'date'
}

function parseSort(value: string | null): VisitedSort {
  return value === 'oldest' || value === 'visits'
    ? value
    : 'recent'
}

function parsePage(value: string | null): number {
  const page = Number(value)
  return Number.isFinite(page) && page > 0
    ? Math.floor(page)
    : 1
}

function parsePageSize(value: string | null): number {
  const size = Number(value)
  return PAGE_SIZES.includes(size as (typeof PAGE_SIZES)[number])
    ? size
    : PAGE_SIZES[0]
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
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-3 border-y border-border/60 py-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
        <Skeleton className="h-3 w-2/3" />
      </div>

      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-24 w-full" />

      <div className="flex flex-col gap-3 border-t border-border/60 pt-5">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-3 px-1 py-2.5">
            <Skeleton className="size-10 shrink-0 rounded-md" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const query: HistoryQuery = {
    q: searchParams.get('q') ?? '',
    type: parseType(searchParams.get('type')),
    range: parseRange(searchParams.get('range')),
    author: searchParams.get('author') ?? '',
    view: parseView(searchParams.get('view')),
    group: parseGroup(searchParams.get('group')),
    sort: parseSort(searchParams.get('sort')),
  }

  const [input, setInput] = useState(query.q)
  const [items, setItems] = useState<VisitedItem[] | null>(null)
  const [events, setEvents] = useState<VisitedEvent[] | null>(null)

  const removeRecord = useVisitedStore(state => state.remove)
  const clearRecords = useVisitedStore(state => state.clear)

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      loadVisitedHistory(),
      loadVisitEvents(),
    ]).then(([records, visits]) => {
      if (cancelled)
        return
      setItems(records)
      setEvents(visits)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // 同步 URL 中的 q 到输入框（回退 / 直接访问带参数链接）
  useEffect(() => {
    setInput(query.q)
  }, [query.q])

  // 输入 250ms 后再写 URL，避免每个击键都产生一条历史
  useEffect(() => {
    if (input === query.q)
      return
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (input.trim())
          next.set('q', input.trim())
        else
          next.delete('q')
        next.delete('page')
        return next
      }, { replace: true })
    }, 250)
    return () => clearTimeout(timer)
  }, [input, query.q, setSearchParams])

  const updateQuery = (patch: Partial<HistoryQuery>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      const defaults: Record<string, string> = {
        type: 'all',
        range: 'all',
        view: 'list',
        group: 'date',
        sort: 'recent',
      }

      for (const [key, value] of Object.entries(patch)) {
        if (key === 'q' || key === 'author') {
          const text = String(value ?? '').trim()
          if (text)
            next.set(key, text)
          else
            next.delete(key)
          continue
        }

        if (value === undefined || value === '' || value === defaults[key])
          next.delete(key)
        else
          next.set(key, String(value))
      }

      next.delete('page')
      return next
    }, { replace: true })
  }

  const handleQueryChange = (patch: Partial<HistoryQuery>) => {
    if (patch.q !== undefined) {
      setInput(patch.q)
      return
    }
    updateQuery(patch.view === 'list'
      ? { ...patch, sort: 'recent' }
      : patch)
  }

  const resetFilters = () => {
    setInput('')
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const key of [
        'q',
        'type',
        'range',
        'author',
        'page',
      ])
        next.delete(key)
      return next
    }, { replace: true })
  }

  const now = useMemo(() => Date.now(), [items, events])

  const stats = useMemo(
    () => items
      ? computeVisitedStats(items, events ?? [], now)
      : null,
    [items, events, now],
  )

  const authors = useMemo(
    () => items
      ? topVisitedAuthors(items, VISITED_LIMIT)
      : [],
    [items],
  )

  const filtered = useMemo(
    () => items
      ? filterVisited(items, {
          q: input,
          type: query.type,
          range: query.range,
          author: query.author,
          now,
        })
      : [],
    [
      items,
      input,
      query.type,
      query.range,
      query.author,
      now,
    ],
  )

  const sorted = useMemo(
    () => sortVisited(filtered, query.sort),
    [filtered, query.sort],
  )

  const pageSize = parsePageSize(searchParams.get('per'))
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const page = Math.min(
    Math.max(1, parsePage(searchParams.get('page'))),
    pageCount,
  )
  const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize)
  const pageStart = sorted.length === 0
    ? 0
    : (page - 1) * pageSize + 1
  const pageEnd = Math.min(page * pageSize, sorted.length)

  const isFiltered = input.trim() !== ''
    || query.type !== 'all'
    || query.range !== 'all'
    || query.author !== ''
  const isLoading = items === null || events === null

  const scrollToRecords = () => {
    requestAnimationFrame(() => {
      document.getElementById('history-records')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  const changePage = (nextPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (nextPage <= 1)
        next.delete('page')
      else
        next.set('page', String(nextPage))
      return next
    })
    scrollToRecords()
  }

  const changePageSize = (size: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (size === PAGE_SIZES[0])
        next.delete('per')
      else
        next.set('per', String(size))
      next.delete('page')
      return next
    })
    scrollToRecords()
  }

  const handleAuthorSelect = (key: string) => {
    updateQuery({
      author: query.author === key
        ? ''
        : key,
    })
    scrollToRecords()
  }

  const handleRemove = (key: string) => {
    const separator = key.indexOf(':')
    const type = key.slice(0, separator) as VisitedType
    const targetId = key.slice(separator + 1)

    removeRecord(key)
    setItems(prev => prev?.filter(item => `${item.type}:${item.id}` !== key) ?? prev)
    setEvents(prev => prev?.filter(event => !(event.type === type && event.targetId === targetId)) ?? prev)
  }

  const handleClear = () => {
    clearRecords()
    setItems([])
    setEvents([])
    resetFilters()
  }

  const handleExport = () => {
    if (!items?.length)
      return
    const blob = new Blob([
      serializeVisitedExport(items, events ?? [], now),
    ], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `anon-tweet-history-${new Date(now).toISOString().slice(0, 10)}.json`
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <div className="flex w-full flex-col gap-5 px-3 sm:px-0">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="返回首页"
          render={<Link to="/" />}
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <h2 className="text-lg font-semibold">浏览历史</h2>

        {!isLoading && items.length > 0 && (
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              aria-label="导出浏览历史"
              onClick={handleExport}
            >
              <DownloadIcon className="size-4" />
            </Button>

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
                    本机保存的浏览记录、访问事件与详情缓存都会被删除，无法恢复。
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

      <div className="flex min-w-0 max-w-full flex-col gap-5 rounded-2xl border border-border/50 bg-card/70 p-4 sm:p-5">
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
            <EmptyContent>
              <Button variant="secondary" render={<Link to="/" />}>
                去首页浏览
              </Button>
            </EmptyContent>
          </Empty>
        )}

        {!isLoading && items.length > 0 && stats && (
          <>
            <HistoryOverview stats={stats} />

            <HistoryActivity
              items={items}
              events={events}
              now={now}
            />

            <HistoryInsights
              items={items}
              events={events}
              activeAuthor={query.author}
              onAuthorSelect={handleAuthorSelect}
            />

            <section
              id="history-records"
              className="flex min-w-0 scroll-mt-4 flex-col gap-3 border-t border-border/60 pt-5"
            >
              <h3 className="text-sm font-semibold">记录</h3>

              <HistoryToolbar
                query={{ ...query, q: input }}
                authors={authors}
                isFiltered={isFiltered}
                onChange={handleQueryChange}
                onClear={resetFilters}
              />

              {sorted.length > 0 && (
                <HistoryPagination
                  page={page}
                  pageCount={pageCount}
                  total={sorted.length}
                  pageStart={pageStart}
                  pageEnd={pageEnd}
                  pageSize={pageSize}
                  onPageChange={changePage}
                  onPageSizeChange={changePageSize}
                />
              )}

              {sorted.length === 0 && (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <SearchIcon />
                    </EmptyMedia>
                    <EmptyTitle>没有匹配的记录</EmptyTitle>
                    <EmptyDescription>
                      换个关键词、作者或时间范围，或清除当前筛选。
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button variant="secondary" onClick={resetFilters}>
                      清除筛选
                    </Button>
                  </EmptyContent>
                </Empty>
              )}

              {sorted.length > 0 && query.view === 'list' && (
                <HistoryList
                  items={pageItems}
                  groupBy={query.group}
                  onRemove={handleRemove}
                  now={now}
                />
              )}

              {sorted.length > 0 && query.view === 'table' && (
                <HistoryTable
                  items={pageItems}
                  onRemove={handleRemove}
                  now={now}
                />
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
