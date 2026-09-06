/**
 * Web Share Target 接收辅助（纯函数）。
 *
 * anonTweet 以首页 "/" 作为 share_target 的 GET 接收点：系统分享命中后 Chrome 会
 * 带 query（title / text / url）重新打开首页。本模块负责：
 * 1. 从分享 query 挑选最可能是「链接」的那份内容（url 优先，其次 text，最后 title）；
 * 2. 对原始内容做与首页输入框一致的解析，返回跳转目标或保持本页待手动的错误。
 *
 * 与 TweetInputForm 共用同一套 url-detect 判定，保证「系统分享」与「手动粘贴」
 * 的行为完全一致（可识别 → 自动跳 /tweets/:id | /ins/:id；不可识别 → 留框报错）。
 */
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
