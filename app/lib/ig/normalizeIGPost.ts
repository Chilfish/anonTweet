import type { DirectoryMsg, Message, ParsedMedia, ParsedPost, UrlMsg } from '@chilfish/gallery-dl-instagram'
import type { IGAudio, IGMedia, IGPost, IGStoryLink } from '~/types'

const IG_ROOT = 'https://www.instagram.com'
const IG_ID_SEP = '~'

/** directory 元数据在 SDK `ParsedPost` 之外的补充字段（user 等）。 */
type DirectoryMeta = ParsedPost & {
  post_date?: string
  user?: { profile_pic_url?: string, is_verified?: boolean }
  location_slug?: string
  coauthors?: { username: string, full_name?: string }[]
}

/** 仅含音频的 url 消息（`_files` 里的 BGM 条目）不应当作媒体。 */
function isAudioOnly(m: ParsedMedia): boolean {
  return Boolean((m as unknown as { audio_url?: string }).audio_url)
}

function toMedia(m: ParsedMedia, index: number): IGMedia {
  return {
    num: m.num ?? index,
    media_id: m.media_id,
    shortcode: m.shortcode,
    display_url: m.display_url,
    video_url: m.video_url,
    width: m.width,
    height: m.height,
    width_original: m.width_original,
    height_original: m.height_original,
    type: (m.video_url ? 'video' : 'photo') as IGMedia['type'],
    tagged_users: m.tagged_users,
  }
}

function toAudio(m: ParsedMedia | undefined): IGAudio | undefined {
  if (!m?.audio_title)
    return undefined
  return {
    title: m.audio_title,
    subtitle: m.audio_subtitle,
    artist: m.audio_artist,
    duration: m.audio_duration,
    cover_artwork_uri: m.audio_cover_artwork_uri,
    cover_artwork_thumbnail_uri: m.audio_cover_artwork_thumbnail_uri,
    has_lyrics: m.audio_has_lyrics,
    is_explicit: m.audio_is_explicit,
  }
}

/** 故事链接贴纸（swipe-up CTA）挂在单个 media 上。 */
function toStoryLink(m: ParsedMedia): IGStoryLink | undefined {
  if (!m.story_link_url)
    return undefined
  return {
    url: m.story_link_url,
    title: m.story_link_title ?? '',
    display: m.story_link_display,
    type: m.story_link_type,
  }
}

function toResharedFrom(meta: DirectoryMeta): IGPost['resharedFrom'] {
  return meta.tagged_username
    ? { username: meta.tagged_username, fullname: meta.tagged_full_name }
    : undefined
}

/** 单条 story / highlight item → 独立 IGPost（id 即该 item 的 canonical 缓存键）。 */
function buildStoryItem(meta: DirectoryMeta, m: ParsedMedia): IGPost {
  const isHighlight = meta.type === 'highlight'
  const id = isHighlight
    ? `highlight${IG_ID_SEP}${meta.post_id}${IG_ID_SEP}${m.media_id}`
    : `story${IG_ID_SEP}${meta.username}${IG_ID_SEP}${m.media_id}`

  return {
    id,
    post_id: m.media_id,
    url: isHighlight
      ? `${IG_ROOT}/stories/highlights/${meta.post_id}/`
      : `${IG_ROOT}/stories/${meta.username}/${m.media_id}/`,
    username: meta.username,
    fullname: meta.fullname,
    description: meta.description ?? '',
    tags: meta.tags,
    likes: 0,
    type: meta.type,
    media: [toMedia(m, m.num ?? 1)],
    created_at: m.date ?? meta.post_date,
    avatar_url: meta.user?.profile_pic_url,
    audio: toAudio(m),
    verified: meta.user?.is_verified,
    location_name: meta.location_slug,
    expires: m.expires ?? meta.expires,
    highlight_title: meta.highlight_title,
    storyLink: toStoryLink(m),
    resharedFrom: toResharedFrom(meta),
  }
}

/** 普通 post / reel → 单张 IGPost（全部 media 收进同一张卡）。 */
function buildSinglePost(meta: DirectoryMeta, mediaMeta: ParsedMedia[]): IGPost {
  const audioParsed = mediaMeta.find(m => m.audio_title)

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
    media: mediaMeta.map((m, i) => toMedia(m, i)),
    created_at: meta.post_date,
    avatar_url: meta.user?.profile_pic_url,
    audio: toAudio(audioParsed),
    verified: meta.user?.is_verified,
    location_name: meta.location_slug,
    coauthors: meta.coauthors?.map(c => ({
      username: c.username,
      fullname: c.full_name ?? c.username,
    })),
    expires: meta.expires,
    highlight_title: meta.highlight_title,
    storyLink: mediaMeta.map(toStoryLink).find(Boolean),
    resharedFrom: toResharedFrom(meta),
  }
}

/**
 * 将 SDK `extract()` 返回的消息流标准化为前端 `IGPost` 列表。
 *
 * 纯函数（无 IO / 无 React），供 BFF 路由（`api/ig/get.ts`）与截图 SSR 路由
 * （`plain-ig.tsx`）共用，避免两份映射漂移；离线可用消息流 fixture 单测
 * （AC-IG-STORY-001）。
 *
 * - `story` / `highlight` 精选取类：**每条 url 消息（每个 item）一张 IGPost**，
 *   即用户当前快拍 tray / 精选集会被展开成可逐张下载的列表；
 * - 其它（post / reel）：全部 media 收进一张 IGPost。
 *
 * 消息流通常为：1 个 directory + N 个 url 消息。
 */
export function normalizeIGPosts(messages: Message[]): IGPost[] {
  const dir = messages.find(m => m.type === 'directory') as DirectoryMsg | undefined
  if (!dir)
    return []

  const meta = dir.metadata as unknown as DirectoryMeta
  const urlMsgs = messages.filter(m => m.type === 'url') as unknown as UrlMsg[]
  const mediaMeta = urlMsgs
    .map(m => m.metadata as unknown as ParsedMedia)
    .filter(m => !isAudioOnly(m))

  if (meta.type === 'story' || meta.type === 'highlight')
    return mediaMeta.map(m => buildStoryItem(meta, m))

  return [buildSinglePost(meta, mediaMeta)]
}

/** 单张 post 的便捷包装（= 列表首项），供只关心单帖的调用点使用。 */
export function normalizeIGPost(messages: Message[]): IGPost | null {
  return normalizeIGPosts(messages)[0] ?? null
}
