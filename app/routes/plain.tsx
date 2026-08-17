import type { Route } from './+types/tweet'
import type { GetTweetSchema } from '~/lib/validations/tweet'
import type { EnrichedTweet, TweetData } from '~/types'
import axios from 'axios'
import { Await, redirect, useLoaderData } from 'react-router'
import { MyPlainTweet } from '~/components/tweet/PlainTweet'
import { env } from '~/lib/env.server'
import { TweetNotFound } from '~/lib/react-tweet'
import { extractTweetId } from '~/lib/utils'

export function meta() {
  return [
    { title: '推文截图 | Anon Tweet' },
    { name: 'robots', content: 'noindex, follow' },
  ]
}

/**
 * 截图 SSR 两步走（阶段二任务 1 / AC-DECOUPLE-001）：
 * GET `/api/tweet/get` 只回原文/缓存，翻译统一经 `/api/ai-translation`
 * 用服务端 env key 显式触发（不再依赖 GET 内联 LLM）。
 */
async function translateTweetsForScreenshot(tweets: TweetData, baseUrl: string): Promise<void> {
  if (!env.GEMINI_API_KEY || !env.GEMINI_MODEL)
    return

  const apiUrl = new URL('/api/ai-translation', baseUrl).toString()
  const seen = new Set<string>()

  async function translateChain(tweet: EnrichedTweet) {
    if (seen.has(tweet.id_str))
      return
    seen.add(tweet.id_str)

    const isZhTweet = tweet.lang === 'zh'
    const hasTranslation = tweet.entities?.some(e => !!e.aiTranslation)
      || !!tweet.autoTranslationEntities?.length
    if (hasTranslation || isZhTweet)
      return

    try {
      const { data } = await axios.post(apiUrl, {
        tweet,
        enableAITranslation: true,
        apiKey: env.GEMINI_API_KEY || '',
        model: env.GEMINI_MODEL || '',
        translationGlossary: '',
        force: false,
      })
      if (data?.success && data?.data?.entities) {
        tweet.entities = data.data.entities
        tweet.autoTranslationEntities = undefined
      }
    }
    catch (error: unknown) {
      console.error(`[plain] AI translate tweet ${tweet.id_str} failed:`, error)
    }
  }

  for (const tweet of tweets) {
    await translateChain(tweet)
    if (tweet.quotedTweet)
      await translateChain(tweet.quotedTweet)
  }
}

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

  const origin = new URL(request.url).origin
  const baseUrl = env.HOSTNAME || origin
  const apiUrl = new URL(`/api/tweet/get/${tweetId}`, baseUrl).toString()

  const { data: tweets } = await axios.post<TweetData>(apiUrl, {
    tweetId,
  } satisfies GetTweetSchema)

  if (enableTranslation) {
    await translateTweetsForScreenshot(tweets, baseUrl)
  }

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
