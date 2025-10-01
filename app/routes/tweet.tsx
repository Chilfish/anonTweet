import type { Ref } from 'react'
import type { Route } from './+types/tweet'
import type { TweetData } from '~/types'
import { Suspense, useEffect, useRef } from 'react'
import { Await, useLoaderData, useSearchParams } from 'react-router'
import { BackButton } from '~/components/BackButton'
import { DownloadMedia } from '~/components/DownloadMedia'
import { SaveAsImageButton } from '~/components/saveAsImage'
import { SettingsPanel } from '~/components/SettingsPanel'
import { MyTweet } from '~/components/tweet/Tweet'
import { getTweets } from '~/lib/getTweet'
import { TweetNotFound, TweetSkeleton } from '~/lib/react-tweet'
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
  request,
}: Route.LoaderArgs): Promise<TweetData & {
  tweetId?: string
}> {
  const isDebug = new URLSearchParams(request.url.split('?')[1]).get('debug') === 'true'
  if (isDebug) {
    return { tweet: null, parentTweets: [], quotedTweet: null, tweetId: params.id }
  }
  const { id } = params
  const tweetId = extractTweetId(id)
  if (!tweetId) {
    return { tweet: null, parentTweets: [], quotedTweet: null, tweetId: id }
  }
  const { tweet, parentTweets, quotedTweet } = await getTweets(tweetId)
  return { tweet, parentTweets, quotedTweet, tweetId }
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
  const { setTweetElRef, setAllTweets } = useTranslationStore()

  if (plain && tweetId) {
    return <TweetContent />
  }

  useEffect(() => {
    if (tweetRef.current) {
      setTweetElRef(tweetRef.current)
    }
  }, [tweetRef.current])

  useEffect(() => {
    if (loaderData.tweet) {
      setAllTweets({
        tweet: loaderData.tweet,
        quotedTweet: loaderData.quotedTweet,
        parentTweets: loaderData.parentTweets,
      })
    }
  }, [loaderData.tweet])

  return (
    <>
      <div className="flex items-center w-full gap-1 mb-6">
        <BackButton />
        <SaveAsImageButton />
        <SettingsPanel />
        <DownloadMedia />
      </div>

      <TweetContent
        ref={tweetRef}
      />
    </>
  )
}
