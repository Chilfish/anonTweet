/**
 * Web Share Target 接收辅助（纯函数）+ Web Share 出向载荷。
 *
 * anonTweet 以首页 "/" 作为 share_target 的 GET 接收点：系统分享命中后 Chrome 会
 * 带 query（title / text / url）重新打开首页。本模块负责：
 * 1. 从分享 query 挑选最可能是「链接」的那份内容（url 优先，其次 text，最后 title）；
 * 2. 对原始内容做与首页输入框一致的解析，返回跳转目标或保持本页待手动的错误。
 *
 * 出向（AC-PWA-006）：把正在看的推文 / IG 帖子转成 `{ title, text, url }` 载荷交给
 * navigator.share；无该 API 的环境由调用方降级为复制原文链接。
 *
 * 与 TweetInputForm 共用同一套 url-detect 判定，保证「系统分享」与「手动粘贴」
 * 的行为完全一致（可识别 → 自动跳 /tweets/:id | /ins/:id；不可识别 → 留框报错）。
 */
import type { EnrichedTweet, Entity, IGPost } from '~/types'
import {
  detectInputType,
  extractIGId,
  extractTweetId,
} from '~/lib/url-detect'

export interface SharedContent {
  title?: string
  text?: string
  url?: string
}

/**
 * 从分享 payload 中挑选用于解析的内容。
 * 大部分 Android 源 App 把链接放 `url`、把正文放 `text`；少数只放其中一个，
 * 极少数仅 title。优先级：url → text → title（三者都空则 ''）。
 */
export function pickSharedInput(shared: SharedContent): string {
  const candidates = [shared.url, shared.text, shared.title]
  for (const c of candidates) {
    if (c && c.trim())
      return c
  }
  return ''
}

export type ShareResolveResult
  = | { ok: true, to: string }
    | { ok: false, error: string }

/**
 * 与首页表单同语义的目标解析：
 * - Twitter/X → `/tweets/{id}`
 * - Instagram → `/ins/{id}`
 * - 其余 → { ok:false, error }，由调用方把内容留在输入框并展示错误（与手动提交一致）。
 */
export function resolveShareTarget(raw: string): ShareResolveResult {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { ok: false, error: '请输入 Tweet 或 Instagram 的 URL。' }
  }

  const type = detectInputType(trimmed)

  if (type === 'twitter') {
    const tweetId = extractTweetId(trimmed)
    if (!tweetId) {
      return { ok: false, error: '无法识别有效的 Tweet URL 或 ID，请检查格式。' }
    }
    return { ok: true, to: `/tweets/${tweetId}` }
  }

  if (type === 'instagram') {
    const igId = extractIGId(trimmed)
    if (!igId) {
      return { ok: false, error: '无法识别有效的 Instagram URL，请检查格式。' }
    }
    return { ok: true, to: `/ins/${igId}` }
  }

  return { ok: false, error: '无法识别有效的 Tweet 或 Instagram URL，请检查格式。' }
}

/** 是否为一次有效的系统分享落地（存在任一分享字段）。 */
export function hasSharedContent(shared: SharedContent): boolean {
  return Boolean(shared.url?.trim() || shared.text?.trim() || shared.title?.trim())
}

// ---------------------------------------------------------------------------
// 出向分享（AC-PWA-006）：Web Share API 载荷组装 + 能力/结果判定
// ---------------------------------------------------------------------------

export interface SharePayload {
  title: string
  text: string
  url: string
}

/** 是否有原生系统分享能力（Node / 旧浏览器无 navigator.share）。 */
export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

/**
 * 执行出向分享：有 navigator.share 走系统分享（用户取消视为完成，不报错）；
 * 否则回退复制 `payload.url`。调用方按结果决定 toast 文案。
 */
export async function shareOut(payload: SharePayload): Promise<'shared' | 'aborted' | 'copied' | 'failed'> {
  if (canNativeShare()) {
    try {
      await navigator.share(payload)
      return 'shared'
    }
    catch (error) {
      // 用户主动关闭系统分享面板不算失败
      if (typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError')
        return 'aborted'
      return 'failed'
    }
  }

  try {
    await navigator.clipboard.writeText(payload.url)
    return 'copied'
  }
  catch {
    return 'failed'
  }
}

/**
 * 把 entities 渲染为纯文本分享正文：非文本实体（media/media_alt/separator）剔除，
 * 有翻译时逐段「manual translation > aiTranslation > 原文」取译文，否则取原文。
 * 语义对齐视图层（AC-RESOLVER-001 的显示链），避免夹带 Markdown 语法。
 */
function renderShareText(list: Entity[], preferTranslation: boolean): string {
  if (!list?.length)
    return ''

  return list
    .map((entity) => {
      if (entity.type === 'media' || entity.type === 'media_alt' || entity.type === 'separator')
        return ''
      const content = preferTranslation
        ? (entity.translation || entity.aiTranslation || entity.text)
        : entity.text
      return content?.trim() || ''
    })
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 组装推文出向分享载荷：url 用完整链接（无则回退 x.com 规范链接），text 译文优先。 */
export function buildTweetSharePayload(tweet: EnrichedTweet): SharePayload {
  const entities = tweet.entities ?? []
  const hasTranslation = entities.some(e => !!e.translation || !!e.aiTranslation)
  const useLegacy = !hasTranslation && !!tweet.autoTranslationEntities?.length
  const list = hasTranslation || !useLegacy ? entities : (tweet.autoTranslationEntities ?? [])
  const preferTranslation = hasTranslation || useLegacy

  const handle = tweet.user?.screen_name?.trim() || ''
  const name = tweet.user?.name?.trim() || ''
  const rawText = renderShareText(list, preferTranslation) || tweet.text?.trim() || ''

  const url = tweet.url?.trim() || (handle
    ? `https://x.com/${handle}/status/${tweet.id_str}`
    : `https://x.com/i/web/status/${tweet.id_str}`)

  return {
    title: `${name}${handle ? ` (@${handle})` : ''} 的推文`,
    text: rawText,
    url,
  }
}

/** 组装 IG 帖子出向分享载荷：caption 译文优先（captionTranslation），否则原文。 */
export function buildIGSharePayload(post: IGPost): SharePayload {
  const handle = post.username?.trim() || ''
  const name = post.fullname?.trim() || ''
  const text = post.captionTranslation?.trim() || post.description?.trim() || ''

  return {
    title: `${name || `@${handle}`} (@${handle}) 的 Instagram 帖子`,
    text,
    url: post.url?.trim() || `https://www.instagram.com/p/${post.id}/`,
  }
}
