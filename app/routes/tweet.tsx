import type { Route } from './+types/tweet'
import type { TweetData } from '~/types'
import axios from 'axios'
import { Suspense, useEffect } from 'react'
import { Await, useLoaderData, useSearchParams } from 'react-router'
import { LayoutComponent } from '~/components/layout/Layout'
import { BackButton } from '~/components/translation/BackButton'
import { DownloadMedia } from '~/components/translation/DownloadMedia'
import { SaveAsImageButton } from '~/components/translation/saveAsImage'
import { ToggleTransButton } from '~/components/translation/ToggleTransButton'
import UpdateTranslation from '~/components/translation/UpdateTranslation'
import { MyTweet } from '~/components/tweet/Tweet'
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

export async function clientLoader({
  params,
}: Route.LoaderArgs): Promise<{
  tweets: TweetData
  tweetId?: string
}> {
  const { id } = params
  const tweetId = extractTweetId(id)
  if (!tweetId) {
    return {
      tweets: [],
      tweetId: id,
    }
  }
  // const tweets = await getTweets(tweetId)
  const { data: tweets } = await axios.get<TweetData>(`/api/tweet/get/${tweetId}`)
  return {
    tweets,
    tweetId,
  }
}

function TweetContent() {
  const loaderData = useLoaderData<typeof clientLoader>()
  const { screenshoting } = useTranslationStore()

  return (
    <Suspense fallback={<HydrateFallback />}>
      <Await
        resolve={loaderData}
        errorElement={<TweetNotFound />}
        children={resolvedTweet =>
          resolvedTweet.tweets && resolvedTweet.tweetId
            ? (
                <MyTweet
                  tweets={resolvedTweet.tweets}
                  mainTweetId={resolvedTweet.tweetId}
                  showMp4CoverOnly={screenshoting}
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

  const { setAllTweets } = useTranslationStore()

  if (plain && tweetId) {
    return <TweetContent />
  }

  useEffect(() => {
    if (loaderData.tweets.length) {
      console.log(loaderData)
      setAllTweets(loaderData.tweets, tweetId)
    }
  }, [loaderData.tweets])

  return (
    <LayoutComponent>
      <div className="flex items-center w-full gap-1 mb-6">
        <BackButton />
        <ToggleTransButton />
        <SaveAsImageButton />
        <DownloadMedia />
        <UpdateTranslation />
      </div>

      <TweetContent />
    </LayoutComponent>
  )
}
