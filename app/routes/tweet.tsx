import type { GetTweetSchema } from '~/lib/validations/tweet'
import type { TweetData } from '~/types'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import useSWR from 'swr'
import { MyTweet } from '~/components/tweet/Tweet'
import { TweetHeader } from '~/components/tweet/TweetHeader'
import { fetcher } from '~/lib/fetcher'
import { TweetNotFound, TweetSkeleton } from '~/lib/react-tweet'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { useTranslationStore } from '~/lib/stores/translation'
import { useTranslationDictionaryStore } from '~/lib/stores/TranslationDictionary'
import { extractTweetId } from '~/lib/utils'

export function meta() {
  return [
    { title: `Anon Tweets` },
    {
      name: 'description',
      content: `一个第三方 Twitter 查看器，专注于阅读体验和用户友好的界面设计。`,
    },
  ]
}

async function getTweets(args: GetTweetSchema): Promise<TweetData> {
  const { data } = await fetcher.post<TweetData>(`/api/tweet/get/${args.tweetId}`, args)
  return data
}

export default function TweetPage() {
  const { id } = useParams()
  const tweetId = id ? extractTweetId(id) : null
  const navigate = useNavigate()
  const { setAllTweets } = useTranslationStore()
  const [isStoreReady, setIsStoreReady] = useState(false)
  const appConfig = useAppConfigStore()
  const { enableAITranslation, geminiApiKey, geminiModel, translationGlossary } = appConfig
  const { getFormattedEntries } = useTranslationDictionaryStore()

  if (!tweetId) {
    return (
      <>
        <TweetHeader />
        <TweetNotFound tweetId={id} />
      </>
    )
  }

  useEffect(() => {
    setIsStoreReady(true)
  }, [])

  const { data: tweets, error, isLoading } = useSWR<TweetData>(
    (tweetId && isStoreReady) ? tweetId : null,
    () => {
      const dictEntries = getFormattedEntries()
      const combinedGlossary = [dictEntries, translationGlossary].filter(Boolean).join('\n')

      return getTweets({
        tweetId,
        enableAITranslation,
        translationGlossary: combinedGlossary,
        apiKey: geminiApiKey,
        model: geminiModel,
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
      }
    }
  }, [tweets, tweetId, navigate, setAllTweets])

  // Check for retweet to show skeleton while redirecting
  const isRetweet = tweets?.[0]?.retweetedOrignalId && tweets[0].retweetedOrignalId !== tweets[0].id_str

  if (isLoading || isRetweet || !isStoreReady) {
    return (
      <>
        <TweetHeader />
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
        <TweetHeader />
        <TweetNotFound tweetId={tweetId} error={error} />
      </>
    )
  }

  return (
    <>
      <TweetHeader />
      <MyTweet
        tweets={tweets}
        mainTweetId={tweetId}
        showComments={true}
      />
    </>
  )
}
