import type { MediaAnimatedGif, MediaDetails, MediaVideo } from '~/types'
import { normalizeMediaUrl } from '~/lib/media-url'
import { useProxyMedia } from '~/lib/stores/appConfig'

export * from './date-utils'
export type {
  ArticleBlock,
  ArticleInlineStyle,
  ArticleMedia,
  ArticleRun,
  Entity,
  EntityWithType,
  MediaAltEntity,
  SeparatorEntity,
  TranslationEntity,
  TweetArticle,
  TweetPoll,
} from '@chilfish/tweet'
export {
  applyAITranslations,
  collectEmbeddedTweetIds,
  derivePlainText,
  enrichTweet,
  extractArticleIdFromUrl,
  extractAudiospaceId,
  extractSpaceIdFromUrl,
  getEntities,
  getMediaAltEntities,
  isArticleUrl,
  isSpaceUrl,
  mapArticle,
  mapPollCard,
  mapSpaceDetails,
  mediaFromRaw,
  normalizeEntityMap,
  organizeTweets,
  parseContentState,
  parseTrendingCard,
  resolveArticleId,
  resolveArticleLink,
  resolveSpaceId,
  resolveSpacePlaybackState,
  restoreEntities,
  serializeForAI,
} from '@chilfish/tweet'

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
  const video = mp4Videos.length > 1
    ? mp4Videos[1]!
    : mp4Videos[0]!

  const proxyMedia = useProxyMedia()
  video.url = proxyMedia(video.url, true)
  return video
}

const CTA_LABELS: Record<string, string> = {
  'Learn more': '了解更多',
  'Visit': '访问',
  'Shop now': '立即购买',
  'Book now': '立即预订',
  'Sign up': '注册',
  'Download': '下载',
  'Install': '安装',
  'Watch': '观看',
  'Listen': '收听',
  'Get offer': '获取优惠',
  'Order now': '立即下单',
  'Shop': '购买',
  'Play': '播放',
}

/** 把 `@chilfish/tweet` 的英文 CTA 文案映射为中文；未知值原样返回。 */
export function localizeCtaLabel(label?: string): string | undefined {
  return label
    ? CTA_LABELS[label] ?? label
    : label
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
