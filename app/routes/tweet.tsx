import type { Ref } from 'react'
import type { Route } from './+types/tweet'
import type { Tweet } from '~/lib/react-tweet/api'
import { Suspense, useEffect, useRef } from 'react'
import { Await, useLoaderData, useSearchParams } from 'react-router'
import { BackButton } from '~/components/BackButton'
import { SaveAsImageButton } from '~/components/saveAsImage'
import { SettingsPanel } from '~/components/SettingsPanel'
import { MyTweet } from '~/components/tweet/Tweet'
import { TweetNotFound, TweetSkeleton } from '~/lib/react-tweet'
import { getTweet } from '~/lib/react-tweet/api'
import { useTranslationStore } from '~/lib/stores/translation'
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

export function HydrateFallback() {
  return (
    <div className="w-full max-w-2xl">
      <TweetSkeleton />
    </div>
  )
}

export async function loader({
  params,
}: Route.LoaderArgs): Promise<{
  tweet: Tweet | null
  quotedTweet: Tweet | null
  parentTweets: Tweet[]
  tweetId?: string
}> {
  const { id } = params
  const tweetId = extractTweetId(id)
  if (!tweetId) {
    return { tweet: null, parentTweets: [], quotedTweet: null, tweetId: id }
  }

  let tweet = await getTweet(tweetId)
  let quotedTweet: Tweet | null = null
  const mainTweet = tweet || null

  if (!tweet) {
    return { tweet: null, parentTweets: [], quotedTweet: null, tweetId: id }
  }

  const parentTweets: Tweet[] = []

  while (true) {
    if (!tweet.in_reply_to_status_id_str) {
      break
    }
    const parentTweet = await getTweet(tweet.in_reply_to_status_id_str)
    if (!parentTweet) {
      break
    }
    parentTweets.unshift(parentTweet)
    tweet = parentTweet
  }

  if (tweet.quoted_tweet) {
    quotedTweet = await getTweet(tweet.quoted_tweet.id_str)
  }

  return { tweet: mainTweet, parentTweets, quotedTweet }
}

function TweetContent({ ref }: { ref?: Ref<HTMLDivElement> }) {
  const loaderData = useLoaderData<typeof loader>()
  const { screenshoting } = useTranslationStore()

  return (
    <Suspense fallback={<HydrateFallback />}>
      <Await
        resolve={loaderData}
        errorElement={<TweetNotFound />}
        children={resolvedTweet =>
          resolvedTweet.tweet
            ? (
                <MyTweet
                  tweet={resolvedTweet.tweet}
                  quotedTweet={resolvedTweet.quotedTweet}
                  parentTweets={resolvedTweet.parentTweets}
                  showMp4CoverOnly={screenshoting}
                  ref={ref}
                />
              )
            : (
                <TweetNotFound tweetId={resolvedTweet.tweetId} />
              )}
      />
    </Suspense>
  )
}

export default function TweetPage({
  params,
  loaderData,
}: Route.ComponentProps) {
  const [searchParams] = useSearchParams()
  const plain = searchParams.get('plain') === 'true'
  const { id: tweetId } = params

  const tweetRef = useRef<HTMLDivElement>(null)
  const { setTweetElRef, setTweet } = useTranslationStore()

  if (plain && tweetId) {
    return <TweetContent />
  }

  useEffect(() => {
    if (tweetRef.current) {
      setTweetElRef(tweetRef.current)
    }
  }, [tweetRef])

  useEffect(() => {
    if (loaderData.tweet) {
      setTweet(loaderData.tweet)
    }
  }, [loaderData.tweet])

  return (
    <>
      <div className="flex items-center w-full max-w-2xl gap-4">
        <BackButton />
        <SaveAsImageButton />
        <SettingsPanel />
      </div>

      <div
        className="w-full max-w-2xl py-6"
      >
        <TweetContent
          ref={tweetRef}
        />
      </div>
    </>
  )
}
