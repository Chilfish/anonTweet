import type { Route } from './+types/tweet'
import type { TweetSnapshot } from '~/lib/storage/db'
import type { GetTweetSchema } from '~/lib/validations/tweet'
import type { EnrichedTweet, TweetData } from '~/types'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { useNavigate, useParams } from 'react-router'
import useSWR from 'swr'
import { TweetPageSkeleton } from '~/components/skeletons'
import { MyTweet } from '~/components/tweet/Tweet'
import { TweetHeader } from '~/components/tweet/TweetHeader'
import { useAutoTranslateTweets } from '~/hooks/use-auto-translate'
import { usePersistSnapshot } from '~/hooks/use-persist-snapshot'
import { useRecordVisit } from '~/hooks/use-record-visit'
import { useTweetOperations } from '~/hooks/use-tweet-operations'
import { fetcher } from '~/lib/fetcher'
import { normalizeProfileImageUrl } from '~/lib/media-url'
import { TweetNotFound, TweetSkeleton } from '~/lib/react-tweet'
import { buildMeta, clampDescription, ogLocale } from '~/lib/seo'
import { getTweets } from '~/lib/service/getTweet'
import { getLocalTweet } from '~/lib/service/getTweet.server'
import { snapshotKey } from '~/lib/snapshot'
import { loadTweetSnapshot, restoreTweetSnapshot } from '~/lib/snapshot-restore'
import { useCommentIds, useMainTweet, useTranslationActions, useTranslations, useTweets } from '~/lib/stores/hooks'
import { useTranslationStore } from '~/lib/stores/translation'
import { decodeHtmlEntities, extractTweetId } from '~/lib/utils'

export async function loader({ params, request }: Route.LoaderArgs) {
  const { id } = params
  const tweetId = extractTweetId(id)
  const baseUrl = new URL(request.url).origin

  if (!tweetId) {
    return { tweet: null, tweetId: null, baseUrl }
  }
  try {
    // SSR 也走缓存链（localCache → DB → API）：结果由缓存层隐式持久化，
    // 重读命中缓存不再重复打 API；ENABLE_* 关闭时降级回直连，行为不变
    const tweets = await getTweets(tweetId, getLocalTweet)
    const mainTweet = tweets[0] || null
    return { tweet: mainTweet, tweetId, baseUrl }
  }
  catch (error: unknown) {
    // 之前是裸 catch：线上推文页打不开时，日志里连 tweetId 都没有
    console.error(`[tweet] load ${tweetId} failed:`, error)
    return { tweet: null, tweetId, baseUrl }
  }
}

export async function clientLoader({
  params,
  serverLoader,
}: Route.ClientLoaderArgs) {
  const tweetId = params.id
    ? extractTweetId(params.id)
    : null
  if (tweetId) {
    const snapshot = await loadTweetSnapshot(tweetId)
    if (snapshot) {
      restoreTweetSnapshot(snapshot)
      return {
        tweet: snapshot.tweets.find(tweet => tweet.id === tweetId) ?? snapshot.tweets[0] ?? null,
        tweetId,
        baseUrl: window.location.origin,
      }
    }
  }
  return serverLoader()
}

export function meta({ loaderData }: Route.MetaArgs) {
  const tweet = loaderData?.tweet
  const baseUrl = loaderData?.baseUrl

  if (!tweet) {
    return buildMeta({
      title: 'Anon Tweet',
      description: '匿名推文浏览器 — 第三方 Twitter/X 查看器',
      noindex: true,
    })
  }

  const authorName = tweet.user?.name || 'Twitter User'
  const authorHandle = tweet.user?.screen_name
    ? `@${tweet.user.screen_name}`
    : ''
  const tweetText = decodeHtmlEntities(tweet.text || '').replace(/\n/g, ' ').trim()
  const description = clampDescription(tweetText) || `${authorName} 在 X 上发布的推文`
  const title = `${authorName} ${authorHandle} on X: "${description}" | Anon Tweet`

  // Get first media image for og:image（无普通媒体时回退到投票选项图）
  const mediaImage = tweet.mediaDetails?.[0]?.media_url_https
    ?? tweet.poll?.choices.find(choice => choice.imageUrl)?.imageUrl

  return buildMeta({
    title,
    description,
    type: 'article',
    locale: ogLocale(tweet.lang),
    image: mediaImage ?? null,
    baseUrl,
    noindex: true,
  })
}

export function HydrateFallback() {
  return <TweetPageSkeleton />
}

function TweetStructuredData({ tweet }: { tweet: EnrichedTweet }) {
  const tweetUrl = `https://x.com/${tweet.user?.screen_name || 'i'}/status/${tweet.id}`
  const sharedImage = tweet.mediaDetails?.[0]?.media_url_https
    ?? tweet.poll?.choices.find(choice => choice.imageUrl)?.imageUrl
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SocialMediaPosting',
    '@id': tweetUrl,
    'url': tweetUrl,
    'headline': decodeHtmlEntities(tweet.text || '').slice(0, 110),
    'text': decodeHtmlEntities(tweet.text || ''),
    'datePublished': tweet.created_at,
    'author': {
      '@type': 'Person',
      'name': tweet.user?.name || '',
      'url': `https://x.com/${tweet.user?.screen_name || ''}`,
    },
    'sharedContent': sharedImage
      ? {
          '@type': 'ImageObject',
          'contentUrl': sharedImage,
        }
      : undefined,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
    />
  )
}

async function fetchTweetData(args: GetTweetSchema): Promise<TweetData> {
  // 本地优先：命中快照直接恢复 store 并返回，不再打 /api/tweet/get
  const snapshot = await loadTweetSnapshot(args.tweetId)
  if (snapshot) {
    restoreTweetSnapshot(snapshot)
    return snapshot.tweets
  }

  const { data } = await fetcher.post<TweetData>(`/api/tweet/get/${args.tweetId}`, args)
  return data
}

export default function TweetPage({ loaderData }: Route.ComponentProps) {
  const { id } = useParams()
  const tweetId = id
    ? extractTweetId(id)
    : null
  const navigate = useNavigate()
  const { setAllTweets } = useTranslationActions()
  const storeTweets = useTweets()
  const storeMainTweet = useMainTweet()
  const translations = useTranslations()
  const commentIds = useCommentIds()
  const isStoreReady = useSyncExternalStore(() => () => {}, () => true, () => false)

  const tweetOperations = useTweetOperations()

  const { setCommentIds } = useTranslationActions()

  // GET 已解耦（AC-DECOUPLE-001）：只拉取缓存/原文，AI 翻译由 useAutoTranslateTweets 触发
  const { data: tweets, error, isLoading } = useSWR<TweetData>(
    (tweetId && isStoreReady)
      ? tweetId
      : null,
    () => fetchTweetData({ tweetId: tweetId! }),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  useAutoTranslateTweets(tweets)

  useEffect(() => {
    if (tweets && tweets.length > 0 && tweetId) {
      console.log(tweets)
      const mainTweet = tweets[0]
      const isRetweet = mainTweet && mainTweet.retweetedOriginalId && mainTweet.retweetedOriginalId !== mainTweet.id

      if (isRetweet) {
        navigate(`/tweets/${mainTweet.id}`, { replace: true })
      }
      else {
        setAllTweets(tweets, tweetId)
        // 快照恢复的评论区要保留；切换推文时旧评论 id 不在新线程里，自动清掉
        const currentCommentIds = useTranslationStore.getState().commentIds
        setCommentIds(currentCommentIds.filter(id => tweets.some(t => t.id === id)))
      }
    }
  }, [
    tweets,
    tweetId,
    navigate,
    setAllTweets,
  ])

  // Check for retweet to show skeleton while redirecting
  const isRetweet = tweets?.[0]?.retweetedOriginalId && tweets[0].retweetedOriginalId !== tweets[0].id

  // Prefer store data if it matches current tweet (allows for updates like loading comments)
  // Fall back to SSR loader data as initial display
  const displayTweets = useMemo(() => {
    if (storeMainTweet?.id === tweetId && storeTweets.length > 0) {
      return storeTweets
    }
    if (tweets)
      return tweets
    if (loaderData.tweet)
      return [loaderData.tweet]
    return undefined
  }, [
    storeMainTweet?.id,
    tweetId,
    storeTweets,
    tweets,
    loaderData.tweet,
  ])

  const visitedTweet = displayTweets?.[0]
  useRecordVisit(visitedTweet
    ? {
        type: 'tweet',
        id: visitedTweet.id,
        title: visitedTweet.user?.name || `@${visitedTweet.user?.screen_name ?? '推文'}`,
        snippet: decodeHtmlEntities(visitedTweet.text || '').replace(/\s+/g, ' ').trim().slice(0, 90),
        image: visitedTweet.user?.profile_image_url_https
          ? normalizeProfileImageUrl(visitedTweet.user.profile_image_url_https)
          : undefined,
        author: visitedTweet.user?.name,
        authorHandle: visitedTweet.user?.screen_name,
      }
    : null)

  // 完整详情（线程 + 译文）落本地快照，下次打开同一推文不再请求
  const snapshotRecord = useMemo<TweetSnapshot | null>(() => {
    if (!tweetId || storeTweets.length === 0)
      return null
    return {
      key: snapshotKey('tweet', tweetId),
      type: 'tweet',
      id: tweetId,
      tweets: storeTweets,
      translations,
      commentIds,
      savedAt: Date.now(),
    }
  }, [
    tweetId,
    storeTweets,
    translations,
    commentIds,
  ])
  usePersistSnapshot(snapshotRecord)

  if (!tweetId) {
    return (
      <>
        <TweetHeader
          isLoadingComments={tweetOperations.isLoadingComments}
          loadComments={tweetOperations.loadComments}
          hasTweets={tweetOperations.hasTweets}
          hasMainTweet={tweetOperations.hasMainTweet}
        />
        <TweetNotFound tweetId={id} />
      </>
    )
  }

  if (isLoading || isRetweet || !isStoreReady) {
    return (
      <>
        <TweetHeader
          isLoadingComments={tweetOperations.isLoadingComments}
          loadComments={tweetOperations.loadComments}
          hasTweets={tweetOperations.hasTweets}
          hasMainTweet={tweetOperations.hasMainTweet}
        />
        <div className="w-full max-w-2xl">
          <TweetSkeleton />
        </div>
      </>
    )
  }

  if (error || !tweets || tweets.length === 0) {
    console.error(error)
    return (
      <>
        <TweetHeader
          isLoadingComments={tweetOperations.isLoadingComments}
          loadComments={tweetOperations.loadComments}
          hasTweets={tweetOperations.hasTweets}
          hasMainTweet={tweetOperations.hasMainTweet}
        />
        <TweetNotFound tweetId={tweetId} error={error} />
      </>
    )
  }

  const mainTweet = displayTweets?.[0]

  return (
    <>
      {mainTweet && <TweetStructuredData tweet={mainTweet} />}
      <TweetHeader
        isLoadingComments={tweetOperations.isLoadingComments}
        loadComments={tweetOperations.loadComments}
        hasTweets={tweetOperations.hasTweets}
        hasMainTweet={tweetOperations.hasMainTweet}
      />
      <MyTweet
        tweets={displayTweets || []}
        mainTweetId={tweetId}
        showComments={true}
        hasMoreComments={tweetOperations.hasMoreComments}
        isLoadingMoreComments={tweetOperations.isLoadingComments}
        loadMoreComments={tweetOperations.loadMoreComments}
      />
    </>
  )
}
