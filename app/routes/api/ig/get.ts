import type { DirectoryMsg, Message, ParsedMedia, ParsedPost, UrlMsg } from '@chilfish/gallery-dl-instagram'
import type { Route } from './+types/get'
import type { IGMedia, IGPost, IGPostData } from '~/types'
import { createSDK } from '@chilfish/gallery-dl-instagram/node'
import { data } from 'react-router'
import { env } from '~/lib/env.server'
import { setLocalCache } from '~/lib/localCache'
import { extractIGId } from '~/lib/utils'

/**
 * 将 SDK extract() 返回的消息流标准化为前端 IGPost 结构。
 *
 * 消息流通常为：1 个 directory + N 个 url 消息。
 */
function normalizeIGPost(messages: Message[]): IGPost | null {
  const dir = messages.find(m => m.type === 'directory') as DirectoryMsg | undefined
  if (!dir)
    return null

  const meta = dir.metadata as ParsedPost
  const urlMsgs = messages.filter(m => m.type === 'url') as UrlMsg[]

  const media: IGMedia[] = urlMsgs.map((msg, i) => {
    const m = msg.metadata as ParsedMedia
    return {
      num: m.num ?? i,
      media_id: m.media_id,
      display_url: m.display_url,
      video_url: m.video_url,
      width: m.width,
      height: m.height,
      width_original: m.width_original,
      height_original: m.height_original,
      type: (m.video_url ? 'video' : 'photo') as IGMedia['type'],
    }
  })

  return {
    id: meta.post_shortcode,
    post_id: meta.post_id,
    url: meta.post_url,
    username: meta.username,
    fullname: meta.fullname,
    description: meta.description,
    tags: meta.tags,
    likes: meta.likes,
    type: meta.type,
    media,
    // IG SDK 不直接提供头像和时间，后续可扩展
    created_at: undefined,
    avatar_url: undefined,
  }
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
    // 1. 创建 SDK 实例并提取
    const ig = await createSDK({ cookies: env.INS_COOKIES })

    const messages: Message[] = []
    for await (const msg of ig.extract(postUrl)) {
      messages.push(msg)
    }

    // 2. 标准化为 IGPost
    const post = normalizeIGPost(messages)
    if (!post) {
      return data(
        { success: false, error: 'Failed to parse Instagram post data' },
        { status: 404 },
      )
    }

    const posts: IGPostData = [post]

    // 3. AI 翻译（TODO Phase 4: 接入翻译管线）
    // if (enableAITranslation && post.description && apiKey && model) {
    //   const translated = await translateIGCaption(post, { apiKey, model, thinkingLevel, translationGlossary })
    // }

    // 4. 缓存写入
    try {
      await setLocalCache({ id: post.id, type: 'ig-post', value: post })
    }
    catch (cacheError) {
      console.warn('[IG] Failed to cache post:', cacheError)
    }

    return posts
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
    const ig = await createSDK({ cookies: env.INS_COOKIES })
    const messages: Message[] = []
    for await (const msg of ig.extract(postUrl)) {
      messages.push(msg)
    }

    const post = normalizeIGPost(messages)
    return post ? [post] : []
  }
  catch (error) {
    console.error(`[IG] GET ${igId}:`, error)
    return data([], { status: 500 })
  }
}
