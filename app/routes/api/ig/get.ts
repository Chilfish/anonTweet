import type { Message } from '@chilfish/gallery-dl-instagram'
import type { Route } from './+types/get'
import type { IGPost, IGPostData } from '~/types'
import { createSDK } from '@chilfish/gallery-dl-instagram/node'
import { data } from 'react-router'
import { env } from '~/lib/env.server'
import { normalizeIGPost } from '~/lib/ig/normalizeIGPost'
import { getProviderStrategy } from '~/lib/providers'
import { getCachedIGPost } from '~/lib/service/getIGPost.server'
import { translateIGCaption } from '~/lib/translateIGCaption'
import { extractIGId } from '~/lib/utils'

/**
 * 通过 SDK 拉取 IG 帖子原始数据并标准化。
 * 不做缓存写入（由 getCachedIGPost 管理）。
 */
async function fetchIGPostFromSDK(postUrl: string): Promise<IGPost | null> {
  const ig = await createSDK({ cookies: env.INS_COOKIES })

  const messages: Message[] = []
  for await (const msg of ig.extract(postUrl)) {
    messages.push(msg)
  }

  return normalizeIGPost(messages)
}

export async function action({ request, params }: Route.ActionArgs) {
  const id = params.id

  if (!id) {
    return data({ success: false, error: 'Missing Instagram post ID' }, { status: 400 })
  }

  // 如果没有配置 INS_COOKIES，返回错误
  if (!env.INS_COOKIES) {
    return data(
      { success: false, error: 'Instagram cookies not configured (INS_COOKIES)' },
      { status: 500 },
    )
  }

  let body: Record<string, any> = {}
  try {
    body = await request.json()
  }
  catch {
    // body 可选
  }

  const {
    enableAITranslation = false,
    apiKey,
    model,
    provider = 'google',
    thinkingLevel,
    translationGlossary,
  } = body

  // 如果是 stories 格式（username/id），需要特殊处理
  const igId = extractIGId(id) ?? id

  let postUrl: string
  if (igId.includes('/')) {
    // stories: username/story_id
    const [username, storyId] = igId.split('/')
    postUrl = `https://www.instagram.com/stories/${username}/${storyId}/`
  }
  else {
    postUrl = `https://www.instagram.com/p/${igId}/`
  }

  try {
    // 1. 三层缓存获取帖子（localCache → DB → SDK）
    const post = await getCachedIGPost(igId, () => fetchIGPostFromSDK(postUrl))

    if (!post) {
      return data(
        { success: false, error: 'Failed to parse Instagram post data' },
        { status: 404 },
      )
    }

    // 2. AI 翻译（如果启用且未翻译过）
    if (enableAITranslation && post.description && apiKey && model) {
      try {
        const strategy = getProviderStrategy(provider)
        const sdkProvider = strategy.createSDKProvider(apiKey)
        const modelInstance = sdkProvider.languageModel(model)

        const translated = await translateIGCaption({
          post,
          modelInstance,
          thinkingLevel,
          translationGlossary,
        })

        if (translated) {
          post.captionTranslation = translated
        }
      }
      catch (transError) {
        console.error('[IG] Translation failed:', transError)
        // 翻译失败不影响帖子返回
      }
    }

    return [post] satisfies IGPostData
  }
  catch (error: any) {
    console.error(`[IG] Failed to extract post ${igId}:`, error)
    return data(
      {
        success: false,
        error: 'Failed to fetch Instagram post',
        message: error.message,
        status: error.status ?? 500,
      },
      { status: error.status ?? 500 },
    )
  }
}

/**
 * GET handler — 简单版，直接从 IG 获取（不触发翻译）。
 */
export async function loader({ params }: Route.LoaderArgs) {
  const id = params.id
  if (!id || !env.INS_COOKIES) {
    return data([], { status: 200 })
  }

  const igId = extractIGId(id) ?? id
  const postUrl = igId.includes('/')
    ? `https://www.instagram.com/stories/${igId.split('/')[0]}/${igId.split('/')[1]}/`
    : `https://www.instagram.com/p/${igId}/`

  try {
    const post = await getCachedIGPost(igId, () => fetchIGPostFromSDK(postUrl))
    return post ? [post] : []
  }
  catch (error) {
    console.error(`[IG] GET ${igId}:`, error)
    return data([], { status: 500 })
  }
}
