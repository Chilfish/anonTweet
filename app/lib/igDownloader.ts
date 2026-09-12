import type { DownloadItem } from '~/lib/downloader'
import type { IGPost } from '~/types'

/**
 * 从 IGPost 提取可下载的媒体文件列表。
 *
 * 直接使用 IG CDN 的 display_url / video_url，
 * 无需像 Twitter 那样经过 proxy 转换。
 */
export function extractIGDownloadItems(post: IGPost): DownloadItem[] {
  if (!post.media?.length)
    return []

  return post.media.map((m, i) => {
    const isVideo = m.type === 'video'
    const url = isVideo ? m.video_url! : m.display_url
    const ext = isVideo ? 'mp4' : 'jpg'
    const suffix = post.media.length > 1 ? `-${i + 1}` : ''
    const filename = `ig-${post.username}-${post.id}${suffix}.${ext}`

    return { url, filename }
  })
}

/**
 * 从 story / highlight 列表提取可下载媒体（tray / 精选集下载场景）。
 *
 * 文件名用 media 短码（唯一、稳定），避免把 canonical id 里的 `~` 带进文件名：
 * `ig-{username}-story-{shortcode}.{ext}`（视频取 video_url）。
 */
export function extractIGStoryDownloadItems(posts: IGPost[]): DownloadItem[] {
  return posts.flatMap(post =>
    post.media.flatMap((m) => {
      const isVideo = m.type === 'video'
      const url = isVideo ? m.video_url : m.display_url
      if (!url)
        return []

      const ext = isVideo ? 'mp4' : 'jpg'
      const key = m.shortcode || m.media_id
      return [{ url, filename: `ig-${post.username}-story-${key}.${ext}` }]
    }),
  )
}
