import type { GetTweetSchema } from '~/lib/validations/tweet'
import type { EnrichedTweet, TweetData } from '~/types'
import type { Route } from './+types/tweet'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { useNavigate, useParams } from 'react-router'
import useSWR from 'swr'
import { MyTweet } from '~/components/tweet/Tweet'
import { TweetHeader } from '~/components/tweet/TweetHeader'
import { useTweetOperations } from '~/hooks/use-tweet-operations'
import { fetcher } from '~/lib/fetcher'
import { TweetNotFound, TweetSkeleton } from '~/lib/react-tweet'
import { getTweets } from '~/lib/service/getTweet'
import { useAIConfig, useMainTweet, useTranslationActions, useTweets } from '~/lib/stores/hooks'
import { useTranslationDictionaryStore } from '~/lib/stores/TranslationDictionary'
import { decodeHtmlEntities, extractTweetId } from '~/lib/utils'

export async function loader({ params, request }: Route.LoaderArgs) {
  const { id } = params
  const tweetId = extractTweetId(id)
  const baseUrl = new URL(request.url).origin

  if (!tweetId) {
    return { tweet: null, tweetId: null, baseUrl }
  }
  try {
    const tweets = await getTweets(tweetId)
    const mainTweet = tweets[0] || null
    return { tweet: mainTweet, tweetId, baseUrl }
  } catch {
    return { tweet: null, tweetId, baseUrl }
  }
}

export function meta({ data }: Route.MetaArgs) {
  const tweet = data?.tweet
  const siteName = 'Anon Tweet'
  const baseUrl = data?.baseUrl || 'https://anontweet.chilfish.top'

  if (!tweet) {
    return [
      { title: `Anon Tweet` },
      { name: 'description', content: '匿名推文浏览器 — 第三方 Twitter/X 查看器' },
    ]
  }

  const authorName = tweet.user?.name || 'Twitter User'
  const authorHandle = tweet.user?.screen_name ? `@${tweet.user.screen_name}` : ''
  const tweetText = decodeHtmlEntities(tweet.text || '').replace(/\n/g, ' ').trim()
  const description = tweetText.length > 160 ? tweetText.slice(0, 157) + '...' : tweetText
  const title = `${authorName} ${authorHandle} on X: "${description}" | Anon Tweet`
  const tweetUrl = `https://x.com/${tweet.user?.screen_name || 'i'}/status/${tweet.id_str}`
  const canonicalUrl = `${baseUrl}/tweets/${tweet.id_str}`

  // Get first media image for og:image
  const mediaImage = tweet.mediaDetails?.[0]?.media_url_https

  const tags = [
    { title },
    { name: 'description', content: description },
    // Open Graph
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:site_name', content: siteName },
    { property: 'og:locale', content: tweet.lang === 'zh' ? 'zh_CN' : 'en_US' },
    // Twitter Card
    { name: 'twitter:card', content: mediaImage ? 'summary_large_image' : 'summary' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:site', content: '@anonTweet' },
    // Canonical
    { tagName: 'link', rel: 'canonical', href: canonicalUrl },
  ]

  if (mediaImage) {
    tags.push({ property: 'og:image', content: mediaImage })
    tags.push({ name: 'twitter:image', content: mediaImage })
  }

  return tags
}

function TweetStructuredData({ tweet }: { tweet: EnrichedTweet }) {
  const tweetUrl = `https://x.com/${tweet.user?.screen_name || 'i'}/status/${tweet.id_str}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SocialMediaPosting',
    '@id': tweetUrl,
    url: tweetUrl,
    headline: decodeHtmlEntities(tweet.text || '').slice(0, 110),
    text: decodeHtmlEntities(tweet.text || ''),
    datePublished: tweet.created_at,
    author: {
      '@type': 'Person',
      name: tweet.user?.name || '',
      url: `https://x.com/${tweet.user?.screen_name || ''}`,
    },
    sharedContent: tweet.mediaDetails?.[0]?.media_url_https ? {
      '@type': 'ImageObject',
      contentUrl: tweet.mediaDetails[0].media_url_https,
    } : undefined,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

async function fetchTweetData(args: GetTweetSchema): Promise<TweetData> {
  const { data } = await fetcher.post<TweetData>(`/api/tweet/get/${args.tweetId}`, args)
  return data
}

export default function TweetPage({ loaderData }: Route.ComponentProps) {
  const { id } = useParams()
  const tweetId = id ? extractTweetId(id) : null
  const navigate = useNavigate()
  const { setAllTweets } = useTranslationActions()
  const storeTweets = useTweets()
  const storeMainTweet = useMainTweet()
  const isStoreReady = useSyncExternalStore(() => () => {}, () => true, () => false)

  const tweetOperations = useTweetOperations()

  const {
    enableAITranslation,
    aiProvider,
    geminiApiKey,
    geminiModel,
    geminiThinkingLevel,
    deepseekApiKey,
    deepseekModel,
    deepseekThinkingLevel,
    translationGlossary,
  } = useAIConfig()

  const { setCommentIds } = useTranslationActions()
  const getFormattedEntries = useTranslationDictionaryStore(state => state.getFormattedEntries)

  const { data: tweets, error, isLoading } = useSWR<TweetData>(
    (tweetId && isStoreReady) ? tweetId : null,
    () => {
      const dictEntries = getFormattedEntries()
      const combinedGlossary = [dictEntries, translationGlossary].filter(Boolean).join('\n')

      const apiKey = aiProvider === 'google' ? geminiApiKey : deepseekApiKey
      const model = aiProvider === 'google' ? geminiModel : deepseekModel
      const thinkingLevel = aiProvider === 'google' ? geminiThinkingLevel : deepseekThinkingLevel

      return fetchTweetData({
        tweetId: tweetId!,
        enableAITranslation,
        translationGlossary: combinedGlossary,
        apiKey,
        model,
        thinkingLevel,
        force: false,
      })
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  useEffect(() => {
    if (tweets && tweets.length > 0 && tweetId) {
      console.log(tweets)
      const mainTweet = tweets[0]
      const isRetweet = mainTweet && mainTweet.retweetedOrignalId && mainTweet.retweetedOrignalId !== mainTweet.id_str

      if (isRetweet) {
        navigate(`/tweets/${mainTweet.id_str}`, { replace: true })
      }
      else {
        setAllTweets(tweets, tweetId)
        setCommentIds([])
      }
    }
  }, [tweets, tweetId, navigate, setAllTweets])

  // Check for retweet to show skeleton while redirecting
  const isRetweet = tweets?.[0]?.retweetedOrignalId && tweets[0].retweetedOrignalId !== tweets[0].id_str

  // Prefer store data if it matches current tweet (allows for updates like loading comments)
  // Fall back to SSR loader data as initial display
  const displayTweets = useMemo(() => {
    if (storeMainTweet?.id_str === tweetId && storeTweets.length > 0) {
      return storeTweets
    }
    if (tweets) return tweets
    if (loaderData.tweet) return [loaderData.tweet]
    return undefined
  }, [storeMainTweet?.id_str, tweetId, storeTweets, tweets, loaderData.tweet])

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
    if (loaderData.tweet) {
      return (
        <>
          <TweetStructuredData tweet={loaderData.tweet} />
          <TweetHeader
            isLoadingComments={tweetOperations.isLoadingComments}
            loadComments={tweetOperations.loadComments}
            hasTweets={tweetOperations.hasTweets}
            hasMainTweet={tweetOperations.hasMainTweet}
          />
          <div className="w-full max-w-2xl">
            <MyTweet
              tweets={[loaderData.tweet]}
              mainTweetId={loaderData.tweetId || tweetId || ''}
              showComments={false}
            />
          </div>
        </>
      )
    }
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
