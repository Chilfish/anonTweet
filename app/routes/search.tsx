import type { FormEvent } from 'react'
import type { EnrichedTweet } from '~/types'
import { ArrowRightIcon, ChevronDownIcon, SearchIcon, SearchXIcon } from 'lucide-react'
import { memo, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { RecentSearches } from '~/components/search/RecentSearches'
import { SearchToolbar } from '~/components/search/SearchToolbar'
import { BackButton } from '~/components/translation/BackButton'
import { MyTweet } from '~/components/tweet/Tweet'
import { Button } from '~/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '~/components/ui/collapsible'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/components/ui/empty'
import { Form } from '~/components/ui/form'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '~/components/ui/input-group'
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group'
import { fetcher } from '~/lib/fetcher'
import { TweetSkeleton } from '~/lib/react-tweet'
import { buildMeta } from '~/lib/seo'
import {
  useIsCapturingSelected,
  useIsTweetSelected,
  useTranslationActions,
  useTweetById,
} from '~/lib/stores/hooks'
import {
  ensureSearchHistoryHydrated,
  useSearchHistoryStore,
} from '~/lib/stores/searchHistory'

/** 搜索结果页随查询串变化且无服务端正文，按 noindex, follow 处理 */
export function meta() {
  return buildMeta({
    title: '推文搜索 | Anon Tweet',
    description: '匿名搜索 Twitter/X 推文，支持 from: / since: / min_faves: 等高级语法，无需登录。',
    noindex: true,
  })
}

interface SearchResponse {
  tweets: EnrichedTweet[]
  nextCursor: string | null
}

/**
 * 单条搜索结果卡片。
 *
 * 数据流：卡片经 `appendTweets` 并入全局 store（合并去重、不动 mainTweet），渲染从
 * store 按 id 订阅（`useTweetById`）——这样翻译弹窗的 AI 翻译（updateTweet）与手动
 * 编辑（setTranslation）才会实时反映到卡片。AI 翻译只按需显式触发（卡片弹窗里的
 * 「AI 翻译」按钮），搜索加载时不会自动翻译全部结果。
 *
 * 选择截图时：未选中的卡片整卡隐藏（不留 .tweet-container 边框空壳），而非只藏内部节点。
 */
const MemoizedTweetItem = memo(({ tweet: initialTweet }: { tweet: EnrichedTweet }) => {
  const { appendTweets } = useTranslationActions()
  const displayTweet = useTweetById(initialTweet.id) ?? initialTweet
  const isCapturingSelected = useIsCapturingSelected()
  const isSelected = useIsTweetSelected(initialTweet.id)

  useEffect(() => {
    appendTweets([initialTweet])
  }, [initialTweet, appendTweets])

  if (isCapturingSelected && !isSelected)
    return null

  return (
    <MyTweet
      tweets={[displayTweet]}
      mainTweetId={initialTweet.id}
    />
  )
})

function dedupeTweets(tweets: EnrichedTweet[]): EnrichedTweet[] {
  const seen = new Set<string>()
  return tweets.filter((tweet) => {
    if (seen.has(tweet.id))
      return false
    seen.add(tweet.id)
    return true
  })
}

/** 高级搜索语法快捷插入（X SearchTimeline rawQuery 原样透传） */
const ADVANCED_OPERATORS: { syntax: string, label: string, insert: string }[] = [
  { syntax: 'from:', label: '来自指定用户', insert: 'from:' },
  { syntax: 'to:', label: '发给指定用户', insert: 'to:' },
  { syntax: '#', label: '话题标签', insert: '#' },
  { syntax: 'lang:', label: '语言，如 ja', insert: 'lang:' },
  { syntax: 'min_faves:', label: '最低点赞数', insert: 'min_faves:' },
  { syntax: 'min_retweets:', label: '最低转发数', insert: 'min_retweets:' },
  { syntax: 'since:', label: '起始日期', insert: 'since:' },
  { syntax: 'until:', label: '截止日期', insert: 'until:' },
  { syntax: '-', label: '排除词，如 -广告', insert: '-' },
  { syntax: '"…"', label: '精确短语', insert: '"' },
]

/** 空态示例：只作语法模板，点击仅填入输入框 */
const EXAMPLE_QUERIES = [
  { query: 'from:GeminiApp', label: '只看某个账号' },
  { query: '#原神', label: '按话题找' },
  { query: 'lang:ja', label: '限定语言' },
] as const

export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const type = searchParams.get('type') ?? 'latest'

  const [input, setInput] = useState(q)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [tweets, setTweets] = useState<EnrichedTweet[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  // 结果列表容器：页级操作条的截图捕获节点（不含操作条/加载更多按钮）
  const listRef = useRef<HTMLDivElement | null>(null)

  const recentQueries = useSearchHistoryStore(state => state.queries)
  const hasHistoryHydrated = useSearchHistoryStore(state => state._hasHydrated)
  const recordSearchQuery = useSearchHistoryStore(state => state.record)
  const clearSearchHistoryState = useSearchHistoryStore(state => state.clear)

  useEffect(() => {
    void ensureSearchHistoryHydrated()
  }, [])

  // URL 参数变化（回退/前进/新搜索）时同步输入框
  useEffect(() => {
    setInput(q)
  }, [q])

  // 关键词 / 类型变化 → 重新拉取第一页
  useEffect(() => {
    if (!q) {
      setTweets([])
      setNextCursor(null)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetcher.get<SearchResponse>('/api/tweet/search', {
      params: { q, type, count: 20 },
    })
      .then(({ data }) => {
        if (cancelled)
          return
        setTweets(dedupeTweets(data.tweets))
        setNextCursor(data.nextCursor)
      })
      .catch((err: unknown) => {
        if (cancelled)
          return
        setTweets([])
        setNextCursor(null)
        setError(err instanceof Error
          ? err.message
          : '搜索失败')
      })
      .finally(() => {
        if (!cancelled)
          setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [q, type, reloadKey])

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore)
      return

    setIsLoadingMore(true)
    try {
      const { data } = await fetcher.get<SearchResponse>('/api/tweet/search', {
        params: {
          q,
          type,
          cursor: nextCursor,
          count: 20,
        },
      })
      setTweets(prev => dedupeTweets([
        ...prev,
        ...data.tweets,
      ]))
      setNextCursor(data.nextCursor)
    }
    catch (err: unknown) {
      console.error('Failed to load more search results:', err)
    }
    finally {
      setIsLoadingMore(false)
    }
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const keyword = input.trim()
    if (keyword) {
      recordSearchQuery(keyword)
      navigate(`/search?q=${encodeURIComponent(keyword)}&type=${type}`)
    }
  }

  const insertOperator = (insert: string) => {
    setInput((prev) => {
      const next = prev.trimEnd()
      return next
        ? `${next} ${insert}`
        : insert
    })
  }

  const switchType = (nextType: 'top' | 'latest') => {
    if (nextType === type)
      return
    navigate(q
      ? `/search?q=${encodeURIComponent(q)}&type=${nextType}`
      : '/search')
  }

  const resultCountLabel = nextCursor
    ? `已加载 ${tweets.length} 条`
    : `共 ${tweets.length} 条`

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[600px] flex-col gap-4 px-3 sm:px-0">
      <div className="rounded-2xl border border-border/60 bg-card p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <BackButton />
          <Form
            className="min-w-0 flex-1"
            onSubmit={onSubmit}
          >
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <SearchIcon className="size-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="搜索推文、话题或 @用户"
                aria-label="搜索关键词"
                autoComplete="off"
                enterKeyHint="search"
              />
              <InputGroupAddon align="inline-end">
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="搜索"
                  className="text-muted-foreground"
                >
                  <ArrowRightIcon className="size-4" />
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </Form>
        </div>

        <Collapsible
          open={showAdvanced}
          onOpenChange={setShowAdvanced}
        >
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <ToggleGroup
              value={[type]}
              onValueChange={(value) => {
                const next = value[0]
                if (next === 'top' || next === 'latest')
                  switchType(next)
              }}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="top">热门</ToggleGroupItem>
              <ToggleGroupItem value="latest">最新</ToggleGroupItem>
            </ToggleGroup>

            <CollapsibleTrigger
              render={
                <Button variant="ghost" size="sm" className="text-muted-foreground" />
              }
            >
              <ChevronDownIcon
                className={showAdvanced ? 'rotate-180 transition-transform duration-200 ease-out' : 'transition-transform duration-200 ease-out'}
              />
              高级搜索
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="mt-3 border-t border-border/60 pt-3">
            <p className="text-xs text-muted-foreground">
              点击插入语法，再补上用户名、日期或数字。
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {ADVANCED_OPERATORS.map(op => (
                <button
                  key={op.syntax}
                  type="button"
                  onClick={() => insertOperator(op.insert)}
                  className="flex min-w-0 flex-col gap-0.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.99]"
                >
                  <span className="font-mono text-[13px] text-foreground">{op.syntax}</span>
                  <span className="text-[11px] leading-snug text-muted-foreground">{op.label}</span>
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {!q && (
        <div className="flex flex-col gap-4">
          <RecentSearches
            queries={hasHistoryHydrated
              ? recentQueries
              : []}
            onSelect={query => navigate(`/search?q=${encodeURIComponent(query)}&type=${type}`)}
            onClear={clearSearchHistoryState}
          />
          <Empty>
            <EmptyHeader>
              <EmptyTitle>输入关键词开始搜索</EmptyTitle>
              <EmptyDescription>
                支持
                {' '}
                <code className="font-mono text-xs">from:用户名</code>
                、
                <code className="font-mono text-xs">until:日期</code>
                {' '}
                等高级语法
              </EmptyDescription>
            </EmptyHeader>
            {hasHistoryHydrated && recentQueries.length === 0 && (
              <div className="mt-3 flex w-full max-w-sm flex-col gap-1">
                {EXAMPLE_QUERIES.map(example => (
                  <button
                    key={example.query}
                    type="button"
                    onClick={() => insertOperator(example.query)}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border/60 px-2.5 py-1.5 text-left transition-colors hover:bg-muted/50 active:scale-[0.99]"
                  >
                    <span className="min-w-0 font-mono text-[11px] text-foreground">{example.query}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{example.label}</span>
                  </button>
                ))}
              </div>
            )}
          </Empty>
        </div>
      )}

      {isLoading && (
        <div className="flex w-full flex-col gap-3">
          <TweetSkeleton />
          <TweetSkeleton />
        </div>
      )}

      {!isLoading && error && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>搜索失败</EmptyTitle>
            <EmptyDescription>
              {error}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReloadKey(key => key + 1)}
            >
              重试
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {!isLoading && !error && q && tweets.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>没有找到相关推文</EmptyTitle>
            <EmptyDescription>
              与「
              {q}
              」匹配的结果为空，检查高级语法拼写（from: / until: / min_faves:）
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/search')}
            >
              清空关键词
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {!isLoading && !error && tweets.length > 0 && (
        <>
          <div className="flex items-baseline justify-between gap-2 border-b border-border/60 pb-2">
            <h2 className="text-sm font-semibold">结果</h2>
            <span className="text-xs tabular-nums text-muted-foreground">
              {resultCountLabel}
            </span>
          </div>

          <SearchToolbar
            tweets={tweets}
            listRef={listRef}
          />

          <div
            ref={listRef}
            className="flex w-full flex-col items-center gap-3"
          >
            {tweets.map(tweet => (
              <MemoizedTweetItem
                tweet={tweet}
                key={tweet.id}
              />
            ))}
          </div>

          {nextCursor && (
            <Button
              variant="secondary"
              className="mx-auto"
              disabled={isLoadingMore}
              onClick={loadMore}
            >
              {isLoadingMore ? '加载中...' : '加载更多'}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
