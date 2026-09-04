import type { MediaAnimatedGif, MediaDetails, MediaVideo } from '~/types'
import { normalizeMediaUrl } from '~/lib/media-url'
import { useProxyMedia } from '~/lib/stores/appConfig'

export * from './date-utils'
export * from './entitytParser'
// export * from './get-tweet'
export * from './parseTweet'

export interface TweetCoreProps {
  id: string
  onError?: (error: any) => any
}

/** 媒体图片 URL：统一为 <slug>.<ext> 路径形态（不携带 ?name=/&format= 查询参数），再走代理 */
export function getMediaUrl(media: MediaDetails): string {
  const proxyMedia = useProxyMedia()
  return proxyMedia(normalizeMediaUrl(media.media_url_https))
}

export function getMp4Videos(media: MediaAnimatedGif | MediaVideo) {
  const { variants } = media.video_info
  const sortedMp4Videos = variants
    .filter(vid => vid.content_type === 'video/mp4')
    .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))

  return sortedMp4Videos
}

export function getMp4Video(media: MediaAnimatedGif | MediaVideo) {
  const mp4Videos = getMp4Videos(media)
  // Skip the highest quality video and use the next quality
  const video = mp4Videos.length > 1 ? mp4Videos[1]! : mp4Videos[0]!

  const proxyMedia = useProxyMedia()
  video.url = proxyMedia(video.url, true)
  return video
}

export function formatNumber(n: number): string {
  if (!n)
    return '0'
  if (n > 999999)
    return `${(n / 1000000).toFixed(1)}M`
  if (n > 999)
    return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}
