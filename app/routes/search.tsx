import type { FormEvent } from 'react'
import type { EnrichedTweet } from '~/types'
import { ArrowRightIcon, ChevronDownIcon, SearchIcon, SearchXIcon } from 'lucide-react'
import { memo, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { SearchToolbar } from '~/components/search/SearchToolbar'
import { BackButton } from '~/components/translation/BackButton'
import { MyTweet } from '~/components/tweet/Tweet'
import { Button } from '~/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '~/components/ui/collapsible'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '~/components/ui/empty'
import { Form } from '~/components/ui/form'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '~/components/ui/input-group'
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group'
import { fetcher } from '~/lib/fetcher'
import { TweetSkeleton } from '~/lib/react-tweet'
import {
  useIsCapturingSelected,
  useIsTweetSelected,
  useTranslationActions,
  useTweetById,
} from '~/lib/stores/hooks'

export function meta() {
  return [
    { title: '推文搜索 | Anon Tweet' },
    { name: 'description', content: '匿名搜索 Twitter/X 推文，支持高级搜索语法，无需登录。' },
    { name: 'robots', content: 'noindex, follow' },
  ]
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
  const displayTweet = useTweetById(initialTweet.id_str) ?? initialTweet
  const isCapturingSelected = useIsCapturingSelected()
  const isSelected = useIsTweetSelected(initialTweet.id_str)

  useEffect(() => {
    appendTweets([initialTweet])
  }, [initialTweet, appendTweets])

  if (isCapturingSelected && !isSelected)
    return null

  return (
    <MyTweet
      tweets={[displayTweet]}
      mainTweetId={initialTweet.id_str}
    />
  )
})

function dedupeTweets(tweets: EnrichedTweet[]): EnrichedTweet[] {
  const seen = new Set<string>()
  return tweets.filter((tweet) => {
    if (seen.has(tweet.id_str))
      return false
    seen.add(tweet.id_str)
    return true
  })
}

/** 高级搜索语法快捷插入（X SearchTimeline rawQuery 原样透传） */
const ADVANCED_OPERATORS: { label: string, insert: string, hint?: string }[] = [
  { label: '来自 @', insert: 'from:' },
  { label: '发给 @', insert: 'to:' },
  { label: '话题 #', insert: '#' },
  { label: '最低赞', insert: 'min_faves:' },
  { label: '最低转', insert: 'min_retweets:' },
  { label: '日期起', insert: 'since:' },
  { label: '日期止', insert: 'until:' },
  { label: '语言', insert: 'lang:' },
  { label: '排除词', insert: '-', hint: '如 -广告' },
  { label: '精确短语', insert: '"', hint: '配 "…"' },
]

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
  // 结果列表容器：页级操作条的截图捕获节点（不含操作条/加载更多按钮）
  const listRef = useRef<HTMLDivElement | null>(null)

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
        setError(err instanceof Error ? err.message : '搜索失败')
      })
      .finally(() => {
        if (!cancelled)
          setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [q, type])

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore)
      return

    setIsLoadingMore(true)
    try {
      const { data } = await fetcher.get<SearchResponse>('/api/tweet/search', {
        params: { q, type, cursor: nextCursor, count: 20 },
      })
      setTweets(prev => dedupeTweets([...prev, ...data.tweets]))
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
      navigate(`/search?q=${encodeURIComponent(keyword)}&type=${type}`)
    }
  }

  const insertOperator = (insert: string) => {
    setInput((prev) => {
      const next = prev.trimEnd()
      return next ? `${next} ${insert}` : insert
    })
  }

  const switchType = (nextType: 'top' | 'latest') => {
    if (nextType === type)
      return
    navigate(q ? `/search?q=${encodeURIComponent(q)}&type=${nextType}` : '/search')
  }

  return (
    <div className="flex flex-col gap-4 px-1 w-full">
      <div className="flex items-center w-full gap-4">
        <BackButton />
        <Form
          className="flex-1"
          onSubmit={onSubmit}
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <SearchIcon className="size-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="搜索 Twitter/X 推文..."
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

      <div className="flex items-center justify-between gap-2 flex-wrap">
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

        <Collapsible
          open={showAdvanced}
          onOpenChange={setShowAdvanced}
        >
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
          <CollapsibleContent className="flex flex-wrap items-center justify-center gap-1.5 p-3 rounded-lg border border-border/60 bg-card/60 mt-2">
            <span className="text-xs text-muted-foreground mr-1">快捷插入：</span>
            {ADVANCED_OPERATORS.map(op => (
              <Button
                key={op.label}
                type="button"
                variant="outline"
                size="xs"
                className="font-mono"
                title={op.hint ?? `${op.insert}${op.label.includes('@') ? '用户名' : '…'}`}
                onClick={() => insertOperator(op.insert)}
              >
                {op.label}
              </Button>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {!q && (
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
              等高级语法，点击「高级搜索」可快捷插入运算符
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {isLoading && (
        <div className="w-full max-w-2xl">
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
              ，可尝试切换到「最新 / 热门」或使用简单关键词重试
            </EmptyDescription>
          </EmptyHeader>
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
              」匹配的结果为空，试试切换「热门」，或检查高级语法
              （from: / until: / min_faves:）拼写是否正确
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {!isLoading && !error && tweets.length > 0 && (
        <>
          <SearchToolbar
            tweets={tweets}
            listRef={listRef}
          />

          <div
            ref={listRef}
            className="flex flex-col gap-3 items-center justify-center mx-auto w-fit"
          >
            {tweets.map(tweet => (
              <MemoizedTweetItem
                tweet={tweet}
                key={tweet.id_str}
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
