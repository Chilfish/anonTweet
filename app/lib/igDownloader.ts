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
