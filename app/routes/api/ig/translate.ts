import type { Route } from './+types/translate'
import type { IGPost } from '~/types'
import { data } from 'react-router'
import { env } from '~/lib/env.server'
import { getLocalCache } from '~/lib/localCache'
import { getProviderStrategy } from '~/lib/providers'
import { getDBIGPost, updateIGPostTranslation } from '~/lib/service/getIGPost.server'
import { translateIGCaption } from '~/lib/translateIGCaption'
import { extractIGId } from '~/lib/utils'

/**
 * POST /api/ig/translate/:id
 *
 * 对已缓存的 IG 帖子 caption 执行 AI 翻译，结果写回 DB + localCache。
 *
 * Body: { apiKey, model, provider?, thinkingLevel?, translationGlossary? }
 * Returns: { captionTranslation: string }
 */
export async function action({ request, params }: Route.ActionArgs) {
  const id = params.id

  if (!id) {
    return data({ success: false, error: 'Missing Instagram post ID' }, { status: 400 })
  }

  if (!env.INS_COOKIES) {
    return data(
      { success: false, error: 'Instagram cookies not configured' },
      { status: 500 },
    )
  }

  const igId = extractIGId(id) ?? id

  let body: Record<string, any> = {}
  try {
    body = await request.json()
  }
  catch {
    return data({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    apiKey,
    model,
    provider = 'google',
    thinkingLevel,
    translationGlossary,
    // 手动翻译：直接写入，跳过 AI
    manualTranslation,
  } = body

  // ─── 手动翻译分支 ─────────────────────────
  if (manualTranslation) {
    await updateIGPostTranslation(igId, manualTranslation)
    return { captionTranslation: manualTranslation }
  }

  // ─── AI 翻译分支 ─────────────────────────
  if (!apiKey || !model) {
    return data(
      { success: false, error: 'Missing apiKey or model' },
      { status: 400 },
    )
  }

  try {
    // 1. 从缓存中读取帖子（不重新拉 SDK）
    let post: IGPost | null = null

    // 先查 DB
    const dbHit = await getDBIGPost(igId)
    if (dbHit) {
      post = dbHit
    }
    else {
      // 再查 localCache
      post = await getLocalCache<IGPost | null>({
        id: igId,
        type: 'ig-post',
        getter: async () => null,
      })
    }

    if (!post || !post.description) {
      return data(
        { success: false, error: 'Post not found or has no caption' },
        { status: 404 },
      )
    }

    // 2. 创建 AI model 实例并翻译
    const strategy = getProviderStrategy(provider)
    const sdkProvider = strategy.createSDKProvider(apiKey)
    const modelInstance = sdkProvider.languageModel(model)

    const translated = await translateIGCaption({
      post,
      modelInstance,
      thinkingLevel,
      translationGlossary,
    })

    if (!translated) {
      return data(
        { success: false, error: 'Translation returned empty' },
        { status: 500 },
      )
    }

    // 3. 写回 DB + localCache
    await updateIGPostTranslation(igId, translated)

    return { captionTranslation: translated }
  }
  catch (error: any) {
    console.error(`[IG] Translate ${igId}:`, error)
    return data(
      {
        success: false,
        error: 'Translation failed',
        message: error.message,
      },
      { status: 500 },
    )
  }
}
