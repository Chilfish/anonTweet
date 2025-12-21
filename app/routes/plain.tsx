import type { Route } from './+types/tweet'
import type { TweetData } from '~/types'
import { Await, redirect, useLoaderData } from 'react-router'
import { MyPlainTweet } from '~/components/tweet/PlainTweet'
import { TweetNotFound } from '~/lib/react-tweet'
import { getTweets } from '~/lib/service/getTweet'
import { extractTweetId } from '~/lib/utils'

export async function loader({
  params,
}: Route.LoaderArgs): Promise<Response | {
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
  const tweets = await getTweets(tweetId)
  // const { data: tweets } = await axios.get<TweetData>(`/api/tweet/get/${tweetId}`)

  const isRetweet = tweets[0] && tweets[0].retweetedOrignalId && tweets[0].retweetedOrignalId !== tweets[0].id_str

  if (isRetweet) {
    console.log(tweets)
    return redirect(`/tweets/${tweets[0]?.id_str}`)
  }
  return {
    tweets,
    tweetId,
  }
}

function TweetContent() {
  const loaderData = useLoaderData<typeof loader>()

  return (
    <Await
      resolve={loaderData}
      errorElement={<TweetNotFound />}
      children={resolvedTweet =>
        resolvedTweet.tweets.length && resolvedTweet.tweetId
          ? (
              <MyPlainTweet
                tweets={resolvedTweet.tweets}
                mainTweetId={resolvedTweet.tweetId}
              />
            )
          : (
              <TweetNotFound tweetId={resolvedTweet.tweetId} />
            )}
    />
  )
}

export default function Plain() {
  return (
    <div
      id="main-container"
      className="max-w-fit max-h-fit min-w-[500px] bg-background font-sans antialiased"
    >
      <TweetContent />
    </div>
  )
}
