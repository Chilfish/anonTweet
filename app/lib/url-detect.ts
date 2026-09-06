/**
 * URL 输入类型检测（纯函数，无 DOM / UI 依赖）。
 *
 * 原位于 app/lib/utils.ts；因 utils.ts 顶层 import 了 clsx / date-fns / toast（DOM
 * 侧），服务端 loader 与纯单测不应为此牵连整条 UI 依赖链，故抽离到此文件。
 * utils.ts 以 re-export 保持既有调用点不变（见 app/lib/utils.ts 顶部）。
 *
 * 三种识别能力：
 * - extractTweetId：纯数字 id 或 twitter.com / x.com / mobile 前缀的 status URL
 * - extractIGId：instagram.com 的 p/ reels? reel/ stories/ 三类 shortcode
 * - detectInputType：Twitter 优先，其次 Instagram，否则 null
 */

const TWEET_ID_ONLY_RE = /^\d+$/
const TWITTER_STATUS_RE = /(?:https?:\/\/)?(?:www\.)?twitter\.com\/\w+\/status\/(\d+)/i
const X_STATUS_RE = /(?:https?:\/\/)?(?:www\.)?x\.com\/\w+\/status\/(\d+)/i
const MOBILE_TWITTER_STATUS_RE = /(?:https?:\/\/)?(?:mobile\.)?twitter\.com\/\w+\/status\/(\d+)/i
const MOBILE_X_STATUS_RE = /(?:https?:\/\/)?(?:mobile\.)?x\.com\/\w+\/status\/(\d+)/i
const IG_POST_RE = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:[\w.-]+\/)?p\/([\w-]+)/i
const IG_REEL_RE = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:[\w.-]+\/)?reel\/([\w-]+)/i
const IG_STORIES_RE = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:[\w.-]+\/)?stories\/([^/]+)\/(\d+)/i

export function extractTweetId(input: string): string | null {
  const trimmed = input.trim()

  // If it's already just a tweet ID (numeric string)
  if (TWEET_ID_ONLY_RE.test(trimmed)) {
    return trimmed
  }

  const patterns = [
    // Standard twitter.com URLs
    TWITTER_STATUS_RE,
    // x.com URLs
    X_STATUS_RE,
    // Mobile URLs
    MOBILE_TWITTER_STATUS_RE,
    MOBILE_X_STATUS_RE,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * 从 Instagram URL 提取 shortcode 或 story 标识符。
 *
 * @returns shortcode（post/reel），"username/story_id"（story），或 null
 */
export function extractIGId(input: string): string | null {
  const trimmed = input.trim()

  const patterns = [
    // post: instagram.com/p/{shortcode}/ or instagram.com/{user}/p/{shortcode}/
    IG_POST_RE,
    // reel: instagram.com/reel/{shortcode}/ or instagram.com/{user}/reel/{shortcode}/
    IG_REEL_RE,
    // story: instagram.com/stories/{username}/{story_id}/
    IG_STORIES_RE,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) {
      if (match[2])
        return `${match[1]}/${match[2]}` // stories: username/id
      return match[1]! // post/reel: shortcode
    }
  }

  return null
}

/**
 * 检测输入 URL 的类型
 * @returns 'twitter' | 'instagram' | null
 */
export function detectInputType(input: string): 'twitter' | 'instagram' | null {
  const trimmed = input.trim()
  if (extractTweetId(trimmed))
    return 'twitter'
  if (extractIGId(trimmed))
    return 'instagram'
  return null
}
