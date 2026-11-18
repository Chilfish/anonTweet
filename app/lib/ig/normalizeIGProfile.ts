import type { DirectoryMsg, Message } from '@chilfish/gallery-dl-instagram'
import type { IGProfile } from '~/types'

/** SDK `/{username}/info/` directory 的字段（解析后已归一为数字 / 布尔）。 */
interface InfoMeta {
  username?: string
  fullname?: string
  biography?: string
  profile_pic_url?: string
  profile_pic_url_hd?: string
  follower_count?: number | { count?: number }
  following_count?: number | { count?: number }
  media_count?: number | { count?: number }
  is_private?: boolean
  is_verified?: boolean
  external_url?: string
}

function toCount(value: number | { count?: number } | undefined): number {
  if (typeof value === 'number') {
    return Number.isFinite(value)
      ? value
      : 0
  }
  return typeof value?.count === 'number'
    ? value.count
    : 0
}

/**
 * 将 SDK `/{username}/info/` 的消息流标准化为 `IGProfile`。
 *
 * info extractor 只产出一个 directory（无 url 消息），因此不能复用
 * `normalizeIGPosts`——那会把资料目录误当成一帖空媒体帖子。纯函数，无 IO。
 */
export function normalizeIGProfile(messages: Message[]): IGProfile | null {
  const dir = messages.find(m => m.type === 'directory') as DirectoryMsg | undefined
  if (!dir)
    return null

  const meta = dir.metadata as unknown as InfoMeta
  const username = (meta.username ?? '').trim()
  if (!username)
    return null

  return {
    username,
    fullname: meta.fullname ?? '',
    biography: meta.biography ?? '',
    avatarUrl: meta.profile_pic_url_hd || meta.profile_pic_url || undefined,
    followers: toCount(meta.follower_count),
    following: toCount(meta.following_count),
    mediaCount: toCount(meta.media_count),
    verified: meta.is_verified,
    isPrivate: meta.is_private,
    externalUrl: meta.external_url || undefined,
  }
}
