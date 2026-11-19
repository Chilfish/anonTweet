import type { Route } from './+types/user'
import type { EnrichedTweet, RawUser } from '~/types'
import {
  AlertTriangleIcon,
  MessageCircleIcon,
  Repeat2Icon,
  UserXIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useRevalidator } from 'react-router'
import { ProfileCard } from '~/components/profile/ProfileCard'
import { BackButton } from '~/components/translation/BackButton'
import { MyTweet } from '~/components/tweet/Tweet'
import { Button } from '~/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/components/ui/empty'
import { env } from '~/lib/env.server'
import { fetcher } from '~/lib/fetcher'
import { normalizeProfileImageUrl } from '~/lib/media-url'
import { TweetSkeleton } from '~/lib/react-tweet'
import { buildMeta, clampDescription } from '~/lib/seo'
import { getDBUser } from '~/lib/service/getUser.server'

const USERNAME_RE = /^\w{1,15}$/
const LEADING_AT_RE = /^@/
const REPLY_TARGET_RE = /^@(\w{1,15})/

interface TimelineResponse {
  tweets: EnrichedTweet[]
  nextCursor: string | null
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const username = (params.username ?? '').replace(LEADING_AT_RE, '').trim()
  let user: RawUser | null = null
  let error: string | null = null

  if (username && USERNAME_RE.test(username)) {
    try {
      user = await getDBUser(username)
    }
    catch (cause) {
      error = cause instanceof Error
        ? cause.message
        : '用户资料加载失败'
    }
  }

  return {
    username,
    user,
    error,
    timelineEnabled: env.ENABLE_TIMELINE,
    baseUrl: new URL(request.url).origin,
  }
}

export function meta({ loaderData }: Route.MetaArgs) {
  const user = loaderData?.user
  const title = user
    ? `${user.fullName} (@${user.userName}) | Anon Tweet`
    : '用户资料 | Anon Tweet'
  const description = user?.description
    ? clampDescription(user.description)
    : '查看 Twitter/X 用户资料、简介与公开统计。'

  return buildMeta({
    title,
    description,
    noindex: true,
    baseUrl: loaderData?.baseUrl,
    image: user?.profileImage
      ? normalizeProfileImageUrl(user.profileImage)
      : null,
  })
}

function isStatusError(error: unknown, status: number): boolean {
  if (typeof error !== 'object' || error === null || !('response' in error))
    return false
  return (error as { response?: { status?: number } }).response?.status === status
}

function dedupeTweets(tweets: EnrichedTweet[]): EnrichedTweet[] {
  const seen = new Set<string>()
  return tweets.filter((tweet) => {
    if (seen.has(tweet.id))
      return false
    seen.add(tweet.id)
    return true
  })
}

/** 转推 / 回复上下文标签；普通帖子返回 null */
function TweetContextLabel({ tweet }: { tweet: EnrichedTweet }) {
  if (tweet.retweetedOriginalId) {
    return (
      <span className="flex items-center gap-1 pl-1 text-[11px] text-muted-foreground">
        <Repeat2Icon className="size-3" aria-hidden />
        转推自 @
        {tweet.user.screen_name}
      </span>
    )
  }

  if (tweet.in_reply_to_status_id_str) {
    const target = tweet.text.match(REPLY_TARGET_RE)?.[1]
    return (
      <span className="flex items-center gap-1 pl-1 text-[11px] text-muted-foreground">
        <MessageCircleIcon className="size-3" aria-hidden />
        {target
          ? `回复 @${target}`
          : '回复'}
      </span>
    )
  }

  return null
}

function TimelineHeader({ count }: { count?: number }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-border/60 pb-2">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-semibold">帖子</h2>
        <span className="text-[11px] text-muted-foreground">含回复与转推</span>
      </div>
      {typeof count === 'number' && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {`已加载 ${count} 条`}
        </span>
      )}
    </div>
  )
}

function TimelineNotice({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <TimelineHeader />
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <p className="text-xs text-muted-foreground">{children}</p>
      </div>
    </section>
  )
}

function TimelineSection({
  username,
  enabled,
}: {
  username: string
  enabled: boolean
}) {
  const [tweets, setTweets] = useState<EnrichedTweet[] | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [moreError, setMoreError] = useState('')
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!enabled)
      return

    let cancelled = false
    setTweets(null)
    setCursor(null)
    setError(null)

    fetcher.get<TimelineResponse>(`/api/user/timeline/${username}`)
      .then(({ data }) => {
        if (cancelled)
          return
        setTweets(dedupeTweets(data.tweets))
        setCursor(data.nextCursor)
      })
      .catch((cause: unknown) => {
        if (cancelled)
          return
        setTweets([])
        setError(cause)
      })

    return () => {
      cancelled = true
    }
  }, [username, enabled, reloadKey])

  const loadMore = async () => {
    if (!cursor || isLoadingMore)
      return

    setIsLoadingMore(true)
    setMoreError('')
    try {
      const { data } = await fetcher.get<TimelineResponse>(`/api/user/timeline/${username}`, {
        params: { cursor },
      })
      setTweets(prev => dedupeTweets([
        ...(prev ?? []),
        ...data.tweets,
      ]))
      setCursor(data.nextCursor)
    }
    catch (cause) {
      if (isStatusError(cause, 429))
        setError(cause)
      else
        setMoreError('加载更多失败，请稍后重试。')
    }
    finally {
      setIsLoadingMore(false)
    }
  }

  if (!enabled || isStatusError(error, 429)) {
    return (
      <TimelineNotice>
        当前实例未开启用户时间线，仅显示资料。
      </TimelineNotice>
    )
  }

  if (error) {
    return (
      <section className="flex flex-col gap-3">
        <TimelineHeader />
        <Empty className="rounded-2xl border border-border/60 bg-card py-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertTriangleIcon />
            </EmptyMedia>
            <EmptyTitle>帖子加载失败</EmptyTitle>
            <EmptyDescription>
              上游接口暂时不可用，稍后再试。
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
      </section>
    )
  }

  if (tweets === null) {
    return (
      <section className="flex flex-col gap-3">
        <TimelineHeader />
        <TweetSkeleton />
        <TweetSkeleton />
      </section>
    )
  }

  if (tweets.length === 0) {
    return (
      <TimelineNotice>
        该用户还没有可展示的帖子。
      </TimelineNotice>
    )
  }

  return (
    <section className="flex flex-col gap-3">
      <TimelineHeader count={tweets.length} />

      <div className="flex w-full flex-col items-center gap-3">
        {tweets.map(tweet => (
          <div
            key={tweet.id}
            className="flex w-full max-w-[600px] flex-col gap-1"
          >
            <TweetContextLabel tweet={tweet} />
            <MyTweet
              tweets={[tweet]}
              mainTweetId={tweet.id}
            />
          </div>
        ))}
      </div>

      {moreError && (
        <p className="text-center text-xs text-destructive-foreground">
          {moreError}
        </p>
      )}

      {cursor && (
        <Button
          variant="secondary"
          className="mx-auto"
          disabled={isLoadingMore}
          onClick={loadMore}
        >
          {isLoadingMore ? '加载中...' : '加载更多'}
        </Button>
      )}
    </section>
  )
}

export default function UserPage({ loaderData }: Route.ComponentProps) {
  const { username, user, error, timelineEnabled } = loaderData
  const revalidator = useRevalidator()

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[600px] flex-col gap-4 px-3 sm:px-0">
      <div className="flex w-full">
        <BackButton />
      </div>

      {error
        ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AlertTriangleIcon />
                </EmptyMedia>
                <EmptyTitle>资料加载失败</EmptyTitle>
                <EmptyDescription>
                  {error}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={revalidator.state !== 'idle'}
                  onClick={() => revalidator.revalidate()}
                >
                  {revalidator.state === 'idle'
                    ? '重试'
                    : '重试中...'}
                </Button>
              </EmptyContent>
            </Empty>
          )
        : !user
            ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <UserXIcon />
                    </EmptyMedia>
                    <EmptyTitle>找不到该用户</EmptyTitle>
                    <EmptyDescription>
                      {username
                        ? `@${username} 不存在或账号不可见。`
                        : '用户名格式不正确。'}
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button variant="secondary" size="sm" render={<Link to="/" />}>
                      返回首页
                    </Button>
                  </EmptyContent>
                </Empty>
              )
            : (
                <>
                  <ProfileCard user={user} />
                  <TimelineSection username={user.userName} enabled={timelineEnabled} />
                </>
              )}
    </div>
  )
}
