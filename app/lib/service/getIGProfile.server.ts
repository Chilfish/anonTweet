import type { Message } from '@chilfish/gallery-dl-instagram'
import type { IGPost, IGProfile } from '~/types'
import { createSDK } from '@chilfish/gallery-dl-instagram/node'
import { env } from '~/lib/env.server'
import { normalizeIGFeed } from '~/lib/ig/normalizeIGPost'
import { normalizeIGProfile } from '~/lib/ig/normalizeIGProfile'
import { getLocalCache } from '~/lib/localCache'
import { igUsernameSourceUrl } from '~/lib/url-detect'
import { getIGPostList } from './getIGPost.server'

/** 主页资料缓存 10 分钟：粉丝数 / bio 变化不快，且 info 请求较重。 */
const PROFILE_TTL = 10 * 60 * 1000

/**
 * 用户名解析策略：优先 `info`（`/v1/users/web_profile_info/`，带 session cookies 稳定），
 * 再退回 `web`（抓主页 HTML）。SDK 默认的 `search`（topsearch）上游已返回 404。
 */
const IG_USER_STRATEGIES = ['info', 'web']

/** 通过 SDK 拉取某个 IG 源 URL 的完整消息流。 */
async function fetchMessages(
  sourceUrl: string,
  configure?: (sdk: Awaited<ReturnType<typeof createSDK>>) => void,
): Promise<Message[]> {
  const ig = await createSDK({ cookies: env.INS_COOKIES })
  // 注意：ConfigManager.interpolate 只读到 subcategory 层，必须写在 instagram 层。
  ig.config.set('extractor.instagram.user-strategy', IG_USER_STRATEGIES)
  configure?.(ig)

  const messages: Message[] = []
  for await (const msg of ig.extract(sourceUrl)) {
    messages.push(msg)
  }
  return messages
}

/** 读取并标准化主页资料（localCache 缓存，无 DB 依赖）。 */
export async function getIGProfile(username: string): Promise<IGProfile | null> {
  return getLocalCache<IGProfile | null>({
    id: username.toLowerCase(),
    type: 'ig-profile',
    ttl: PROFILE_TTL,
    getter: async () => normalizeIGProfile(
      await fetchMessages(igUsernameSourceUrl(username, 'info')),
    ),
  })
}

/**
 * 读取主页首屏帖子。
 *
 * SDK 的翻页游标未对外暴露（见 docs/features/instagram/instagram-integration.md），
 * 因此只取第一页：用 `max-posts` 截断，避免翻页触发 6–12s 的请求节流。
 * 每条帖子经 `getIGPostList` 落 localCache + DB，详情页可直接命中。
 */
export async function getIGProfilePosts(username: string, limit: number): Promise<IGPost[]> {
  const messages = await fetchMessages(
    igUsernameSourceUrl(username, 'posts'),
    (sdk) => {
      // 注意：SDK 的 ConfigManager.interpolate 只读到 subcategory 层，
      // 叶子层的 `posts` 不会被检查 —— 必须写在 `extractor.instagram` 下。
      sdk.config.set('extractor.instagram.max-posts', limit)
    },
  )

  const posts = normalizeIGFeed(messages)
  if (!posts.length) {
    return []
  }

  return getIGPostList(async () => posts)
}
