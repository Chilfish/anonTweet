import type { FormEvent } from 'react'
import type { EnrichedTweet } from '~/types'
import { SearchIcon } from 'lucide-react'
import { memo, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { BackButton } from '~/components/translation/BackButton'
import { MyTweet } from '~/components/tweet/Tweet'
import { Button } from '~/components/ui/button'
import { Field } from '~/components/ui/field'
import { Form } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { fetcher } from '~/lib/fetcher'
import { TweetSkeleton } from '~/lib/react-tweet'
import { cn } from '~/lib/utils'

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

const MemoizedTweetItem = memo(({ tweet }: { tweet: EnrichedTweet }) => {
  const wrappedTweets = useMemo(() => [tweet], [tweet])
  return (
    <MyTweet
      tweets={wrappedTweets}
      mainTweetId={tweet.id_str}
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
      <div className="flex flex-col w-full gap-2">
        <div className="flex items-center w-full gap-4">
          <BackButton />
          <Form
            className="justify-center flex-row items-center flex-1"
            onSubmit={onSubmit}
          >
            <Field name="q" className="flex-1">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="搜索 Twitter/X 推文... 支持 from: / until: 等语法"
                type="search"
                className="w-full"
                autoComplete="off"
                enterKeyHint="search"
              />
            </Field>
            <Button type="submit" size="icon" aria-label="搜索">
              <SearchIcon className="size-4" />
            </Button>
          </Form>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(type === 'top' && 'border-(--primary-brand) text-(--primary-brand)')}
            onClick={() => switchType('top')}
          >
            热门
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(type === 'latest' && 'border-(--primary-brand) text-(--primary-brand)')}
            onClick={() => switchType('latest')}
          >
            最新
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-muted-foreground"
            onClick={() => setShowAdvanced(v => !v)}
          >
            高级搜索
          </Button>
        </div>

        {showAdvanced && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-card/60 p-2.5 text-xs text-muted-foreground">
            <span className="mr-1">快捷插入：</span>
            {ADVANCED_OPERATORS.map(op => (
              <button
                key={op.label}
                type="button"
                title={op.hint ?? `${op.insert}${op.label.includes('@') ? '用户名' : '…'}`}
                className="rounded-full border border-border/60 px-2 py-0.5 font-mono transition-colors hover:border-(--primary-brand) hover:text-(--primary-brand)"
                onClick={() => insertOperator(op.insert)}
              >
                {op.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!q && (
        <p className="text-center text-sm text-muted-foreground">
          输入关键词开始搜索，支持
          {' '}
          <code className="font-mono text-xs">from:用户名</code>
          、
          <code className="font-mono text-xs">until:日期</code>
          {' '}
          等高级语法
        </p>
      )}

      {isLoading && (
        <div className="w-full max-w-2xl">
          <TweetSkeleton />
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            搜索失败：
            {error}
          </p>
          <p className="text-xs text-muted-foreground/60">
            可尝试切换到「热门」结果，或使用简单关键词重试
          </p>
        </div>
      )}

      {!isLoading && !error && q && tweets.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <p className="text-sm">
            没有找到与「
            {q}
            」相关的推文
          </p>
          <p className="text-xs text-muted-foreground/60">
            试试「热门」结果，或确认高级语法（如 from: / until: / min_faves:）拼写是否正确
          </p>
        </div>
      )}

      {!isLoading && !error && tweets.length > 0 && (
        <>
          <div className="flex flex-col gap-3 items-center justify-center w-[96vw]">
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
