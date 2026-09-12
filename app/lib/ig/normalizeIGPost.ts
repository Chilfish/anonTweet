import type { DirectoryMsg, Message, ParsedMedia, ParsedPost, UrlMsg } from '@chilfish/gallery-dl-instagram'
import type { IGAudio, IGMedia, IGPost, IGStoryLink } from '~/types'

/**
 * 将 SDK `extract()` 返回的消息流标准化为前端 `IGPost` 结构。
 *
 * 纯函数（无 IO / 无 React），供 BFF 路由（`api/ig/get.ts`）与截图 SSR 路由
 * （`plain-ig.tsx`）共用，避免两份映射漂移；离线可用消息流 fixture 单测
 * （AC-IG-STORY-001）。
 *
 * 消息流通常为：1 个 directory + N 个 url 消息。
 */
export function normalizeIGPost(messages: Message[]): IGPost | null {
  const dir = messages.find(m => m.type === 'directory') as DirectoryMsg | undefined
  if (!dir)
    return null

  const meta = dir.metadata as unknown as ParsedPost & {
    post_date?: string
    user?: { profile_pic_url?: string, is_verified?: boolean }
    location_slug?: string
    coauthors?: { username: string, full_name?: string }[]
  }
  const urlMsgs = messages.filter(m => m.type === 'url') as unknown as UrlMsg[]
  const mediaMeta = urlMsgs.map(m => m.metadata as unknown as ParsedMedia)

  // 从第一条有音频数据的媒体中提取全剧音频信息
  const audioParsed = mediaMeta.find(m => m.audio_title)
  const audio: IGAudio | undefined = audioParsed
    ? {
        title: audioParsed.audio_title,
        subtitle: audioParsed.audio_subtitle,
        artist: audioParsed.audio_artist,
        duration: audioParsed.audio_duration,
        cover_artwork_uri: audioParsed.audio_cover_artwork_uri,
        cover_artwork_thumbnail_uri: audioParsed.audio_cover_artwork_thumbnail_uri,
        has_lyrics: audioParsed.audio_has_lyrics,
        is_explicit: audioParsed.audio_is_explicit,
      }
    : undefined

  const media: IGMedia[] = mediaMeta.map((m, i) => ({
    num: m.num ?? i,
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
  }))

  // 故事链接贴纸（swipe-up CTA）挂在任一 media 上，取第一条有链接的
  const linkParsed = mediaMeta.find(m => m.story_link_url)
  const storyLink: IGStoryLink | undefined = linkParsed?.story_link_url
    ? {
        url: linkParsed.story_link_url,
        title: linkParsed.story_link_title ?? '',
        display: linkParsed.story_link_display,
        type: linkParsed.story_link_type,
      }
    : undefined

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
    created_at: meta.post_date,
    avatar_url: meta.user?.profile_pic_url,
    audio,
    verified: meta.user?.is_verified,
    location_name: meta.location_slug,
    coauthors: meta.coauthors?.map(c => ({
      username: c.username,
      fullname: c.full_name ?? c.username,
    })),
    expires: meta.expires,
    highlight_title: meta.highlight_title,
    storyLink,
    resharedFrom: meta.tagged_username
      ? { username: meta.tagged_username, fullname: meta.tagged_full_name }
      : undefined,
  }
}
