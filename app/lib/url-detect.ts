/**
 * URL 输入类型检测（纯函数，无 DOM / UI 依赖）。
 *
 * 原位于 app/lib/utils.ts；因 utils.ts 顶层 import 了 clsx / date-fns / toast（DOM
 * 侧），服务端 loader 与纯单测不应为此牵连整条 UI 依赖链，故抽离到此文件。
 * utils.ts 以 re-export 保持既有调用点不变（见 app/lib/utils.ts 顶部）。
 *
 * 三种识别能力：
 * - extractTweetId：纯数字 id 或 twitter.com / x.com / mobile 前缀的 status URL
 * - extractIGId：instagram.com 的 p/ reel/ stories/ 三类输入，统一为**单段 canonical id**
 * - detectInputType：Twitter 优先，其次 Instagram，否则 null
 *
 * IG canonical id（分隔符 `~`；URL path 与 Windows 文件名都合法，可安全作缓存键）：
 * - post / reel：`{shortcode}`
 * - 单条 story：`story~{username}~{mediaId}`
 * - 用户当前快拍列表：`stories~{username}`
 * - 精选集：`highlight~{id}`
 *
 * 旧实现的单条 story id 为 `username/mediaId`（含 `/`），既无法命中 `/ins/:id`、
 * `/api/ig/get/:id` 单段路由，也会在 FS 缓存里写出非法文件名——故一并改为 `~`。
 */

const TWEET_ID_ONLY_RE = /^\d+$/
const TWITTER_STATUS_RE = /(?:https?:\/\/)?(?:www\.)?twitter\.com\/\w+\/status\/(\d+)/i
const X_STATUS_RE = /(?:https?:\/\/)?(?:www\.)?x\.com\/\w+\/status\/(\d+)/i
const MOBILE_TWITTER_STATUS_RE = /(?:https?:\/\/)?(?:mobile\.)?twitter\.com\/\w+\/status\/(\d+)/i
const MOBILE_X_STATUS_RE = /(?:https?:\/\/)?(?:mobile\.)?x\.com\/\w+\/status\/(\d+)/i
const IG_POST_RE = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:[\w.-]+\/)?p\/([\w-]+)/i
const IG_REEL_RE = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:[\w.-]+\/)?reel\/([\w-]+)/i
const IG_HIGHLIGHT_RE = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:[\w.-]+\/)?stories\/highlights\/(\d+)/i
const IG_STORY_RE = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:[\w.-]+\/)?stories\/([\w.]+)\/(\d+)/i
const IG_STORIES_TRAY_RE = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:[\w.-]+\/)?stories\/([\w.]+)\/?(?:[?#].*)?$/i

/** canonical id 分隔符（`~` 为 RFC3986 unreserved，且 Windows 文件名合法） */
const IG_ID_SEP = '~'

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
 * 从 Instagram URL 提取 canonical id（见文件头说明）。
 *
 * @returns `{shortcode}`（post/reel）、`story~{username}~{mediaId}`（单条快拍）、
 *          `stories~{username}`（当前全部快拍）、`highlight~{id}`（精选集），或 null
 */
export function extractIGId(input: string): string | null {
  const trimmed = input.trim()

  // 精选集优先于「单条 story / 用户快拍」：/stories/highlights/{id}/
  const highlight = trimmed.match(IG_HIGHLIGHT_RE)
  if (highlight?.[1])
    return `highlight${IG_ID_SEP}${highlight[1]}`

  // 单条 story：/stories/{username}/{mediaId}/
  const story = trimmed.match(IG_STORY_RE)
  if (story?.[1] && story[2])
    return `story${IG_ID_SEP}${story[1]}${IG_ID_SEP}${story[2]}`

  // 用户当前全部快拍：/stories/{username}/（无 mediaId）
  const tray = trimmed.match(IG_STORIES_TRAY_RE)
  if (tray?.[1])
    return `stories${IG_ID_SEP}${tray[1]}`

  for (const pattern of [IG_POST_RE, IG_REEL_RE]) {
    const match = trimmed.match(pattern)
    if (match?.[1])
      return match[1] // post/reel: shortcode
  }

  return null
}

/**
 * 该 canonical id 是否指向「列表型」请求（用户快拍 tray / 精选集）。
 *
 * 注意：highlight 的**单条 item** id 为 `highlight~{hlid}~{mediaId}`（三段），
 * 属内部缓存键而非列表请求，故要求恰好两段。
 */
export function isIGListId(id: string): boolean {
  if (id.startsWith(`stories${IG_ID_SEP}`))
    return true
  if (id.startsWith(`highlight${IG_ID_SEP}`))
    return id.split(IG_ID_SEP).length === 2
  return false
}

/**
 * 该 canonical id 是否属于**快拍族**（单条 story / 用户 tray / 精选集列表）。
 *
 * 用于在请求发出前决定骨架屏与 header 形态（`/ins/:id` 的 loading 分支）——
 * 快拍列表不该闪帖子的九宫格骨架与翻译/截图操作。
 *
 * 注意：`highlight~{id}~{mediaId}` 是列表项的内部缓存键而非路由 id，返回 false 无影响。
 */
export function isIGStoryLikeId(id: string): boolean {
  return id.startsWith(`story${IG_ID_SEP}`) || isIGListId(id)
}

/** canonical id → Instagram 源 URL（交给 SDK `extract()`）。 */
export function igIdToSourceUrl(id: string): string {
  const parts = id.split(IG_ID_SEP)

  if (id.startsWith(`highlight${IG_ID_SEP}`))
    return `https://www.instagram.com/stories/highlights/${parts[1]}/`

  if (id.startsWith(`stories${IG_ID_SEP}`))
    return `https://www.instagram.com/stories/${parts.slice(1).join(IG_ID_SEP)}/`

  if (id.startsWith(`story${IG_ID_SEP}`))
    return `https://www.instagram.com/stories/${parts[1]}/${parts[2]}/`

  return `https://www.instagram.com/p/${id}/`
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
