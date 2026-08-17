import type { Route } from './+types/get'
import { data } from 'react-router'
import z from 'zod'
import { getTweets } from '~/lib/service/getTweet'
import { getLocalTweet } from '~/lib/service/getTweet.server'
import { extractTweetId } from '~/lib/utils'
import { getTweetSchema } from '~/lib/validations/tweet'

/**
 * POST /api/tweet/get/:id — 拉取推文（DB 缓存 → 原文）。
 *
 * 阶段二任务 1（review P1-2 / AC-DECOUPLE-001）：GET 不再内联 AI 翻译——
 * 开启 AI 翻译时首屏不再阻塞等待 LLM 完整返回。翻译统一由客户端触发
 * `/api/ai-translation`（见 app/hooks/use-auto-translate.ts），截图 SSR 走
 * `app/routes/plain.tsx` 的两步流程。schema 中的 AI 字段为旧客户端兼容保留，
 * 本路由不读取。
 */
export async function action({ request }: Route.ActionArgs) {
  const jsonData = await request.json()
  const submission = getTweetSchema.safeParse(jsonData)

  if (!submission.success || !submission.data) {
    return data({
      success: false,
      error: 'Invalid request',
      status: 400,
      message: `Invalid request data`,
      cause: z.flattenError(submission.error),
    })
  }

  const tweetId = extractTweetId(submission.data.tweetId)

  if (!tweetId) {
    return []
  }

  try {
    return await getTweets(tweetId, getLocalTweet)
  }
  catch (error: unknown) {
    console.log(`get tweet ${tweetId}`, error)
    return data({
      success: false,
      error: 'Tweet not found',
      status: 404,
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export async function loader({
  params,
}: Route.LoaderArgs) {
  const { id } = params
  const tweetId = extractTweetId(id)
  if (!tweetId) {
    return []
  }
  try {
    const tweets = await getTweets(tweetId)
    return tweets
  }
  catch (error: unknown) {
    console.log(`Error fetching tweets for ${tweetId}:`, error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = error instanceof Error && 'status' in error
      ? Number((error as { status: unknown }).status) || 500
      : 500
    return data({
      error: 'Failed to fetch tweets',
      message: `无法获取推文，${message}`,
    }, {
      status,
    })
  }
}
