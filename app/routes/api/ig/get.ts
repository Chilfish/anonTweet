import type { Message } from '@chilfish/gallery-dl-instagram'
import type { Route } from './+types/get'
import type { IGPost, IGPostData } from '~/types'
import { createSDK } from '@chilfish/gallery-dl-instagram/node'
import { data } from 'react-router'
import { env } from '~/lib/env.server'
import { normalizeIGPosts } from '~/lib/ig/normalizeIGPost'
import { getProviderStrategy } from '~/lib/providers'
import { getCachedIGPost, getIGPostList } from '~/lib/service/getIGPost.server'
import { translateIGCaption } from '~/lib/translateIGCaption'
import { extractIGId, igIdToSourceUrl, isIGListId } from '~/lib/url-detect'

/** 通过 SDK 拉取 IG 源 URL 的消息流。 */
async function fetchIGMessages(sourceUrl: string): Promise<Message[]> {
  const ig = await createSDK({ cookies: env.INS_COOKIES })

  const messages: Message[] = []
  for await (const msg of ig.extract(sourceUrl)) {
    messages.push(msg)
  }
  return messages
}

/**
 * 通过 SDK 拉取并标准化单张 IG 帖（post / reel / 单条 story）。
 * 不做缓存写入（由 getCachedIGPost 管理）。
 */
async function fetchIGPostFromSDK(sourceUrl: string): Promise<IGPost | null> {
  return normalizeIGPosts(await fetchIGMessages(sourceUrl))[0] ?? null
}

/**
 * 列表型请求（用户当前快拍 tray / 精选集）：拉取并标准化为每 item 一张 post。
 * 不做列表级缓存（由 getIGPostList 逐 item 落缓存）。
 */
async function fetchIGPostListFromSDK(sourceUrl: string): Promise<IGPost[]> {
  return normalizeIGPosts(await fetchIGMessages(sourceUrl))
}

/** 单帖 / 列表两条取数路径，统一返回 `IGPost[]`。 */
async function loadIGPosts(igId: string): Promise<IGPost[]> {
  const sourceUrl = igIdToSourceUrl(igId)

  if (isIGListId(igId))
    return getIGPostList(() => fetchIGPostListFromSDK(sourceUrl))

  const post = await getCachedIGPost(igId, () => fetchIGPostFromSDK(sourceUrl))
  return post ? [post] : []
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

  const igId = extractIGId(id) ?? id

  try {
    // 1. 取数：单帖走三层缓存；tray / 精选集走列表路径（逐 item 落缓存）
    const posts = await loadIGPosts(igId)

    if (!posts.length) {
      return data(
        { success: false, error: 'Failed to parse Instagram post data' },
        { status: 404 },
      )
    }

    // 2. AI 翻译（如果启用且该帖有 caption）
    if (enableAITranslation && apiKey && model) {
      const translatable = posts.filter(p => !!p.description)
      if (translatable.length) {
        try {
          const strategy = getProviderStrategy(provider)
          const sdkProvider = strategy.createSDKProvider(apiKey)
          const modelInstance = sdkProvider.languageModel(model)

          for (const post of translatable) {
            const translated = await translateIGCaption({
              post,
              modelInstance,
              thinkingLevel,
              translationGlossary,
            })
            if (translated)
              post.captionTranslation = translated
          }
        }
        catch (transError) {
          console.error('[IG] Translation failed:', transError)
          // 翻译失败不影响帖子返回
        }
      }
    }

    return posts satisfies IGPostData
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

  try {
    return await loadIGPosts(igId)
  }
  catch (error) {
    console.error(`[IG] GET ${igId}:`, error)
    return data([], { status: 500 })
  }
}
