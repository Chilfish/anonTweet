import type { Route } from './+types/tweet'
import type { GetTweetSchema } from '~/lib/validations/tweet'
import type { TweetData } from '~/types'
import axios from 'axios'
import { Await, redirect, useLoaderData } from 'react-router'
import { MyPlainTweet } from '~/components/tweet/PlainTweet'
import { env } from '~/lib/env.server'
import { TweetNotFound } from '~/lib/react-tweet'
import { extractTweetId } from '~/lib/utils'

export async function loader({
  params,
  request,
}: Route.LoaderArgs): Promise<Response | {
  tweets: TweetData
  enableTranslation: boolean
  tweetId?: string
}> {
  const { id } = params
  const tweetId = extractTweetId(id)
  if (!tweetId) {
    return {
      tweets: [],
      tweetId: id,
      enableTranslation: false,
    }
  }
  const translation = new URL(request.url).searchParams.get('translation') === 'true'
  const enableTranslation = translation && env.ENABLE_AI_TRANSLATION

  const { data: tweets } = await axios.post<TweetData>(`${env.HOSTNAME}/api/tweet/get/${tweetId}`, {
    tweetId,
    translationGlossary: '',
    apiKey: env.GEMINI_API_KEY || '',
    model: env.GEMINI_MODEL || '',
    enableAITranslation: enableTranslation,
  } satisfies GetTweetSchema)

  const isRetweet = tweets[0] && tweets[0].retweetedOrignalId && tweets[0].retweetedOrignalId !== tweets[0].id_str

  if (isRetweet) {
    return redirect(`/tweets/${tweets[0]?.id_str}`)
  }
  return {
    tweets,
    tweetId,
    enableTranslation,
  }
}

function TweetContent() {
  const loaderData = useLoaderData<typeof loader>()

  return (
    <Await
      resolve={loaderData}
      errorElement={<TweetNotFound />}
    >
      {resolvedTweet =>
        resolvedTweet.tweets.length && resolvedTweet.tweetId
          ? (
              <MyPlainTweet
                tweets={resolvedTweet.tweets}
                mainTweetId={resolvedTweet.tweetId}
                enableTranslation={resolvedTweet.enableTranslation}
              />
            )
          : (
              <TweetNotFound tweetId={resolvedTweet.tweetId} />
            )}
    </Await>
  )
}

export default function Plain() {
  return (
    <div
      id="main-container"
      className="max-w-fit max-h-fit min-w-125 bg-background font-sans antialiased"
    >
      <TweetContent />
    </div>
  )
}
