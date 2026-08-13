import type { MediaDetails } from '~/types'

/**
 * AI 视觉描述 —— 图片获取（app/lib/vision/fetchImage.ts）
 *
 * buildMediaUrl：服务端安全的 twimg URL 构建（getMediaUrl 的无 proxy 版）。
 * 与客户端 getMediaUrl 共用同一套 format/name 变换，避免第五套媒体 URL 逻辑
 * （Postmortem #005）。
 * fetchImageDataUri：浏览器头直接 fetch → base64 data URI（DR-5：服务端 fetch
 * 规避浏览器拿不到 twimg CORS 的问题；OpenRouter / Gemini 均接受 data URI）。
 */

export type MediaSize = 'small' | 'medium' | 'large'

export interface FetchedImage {
  /** 对应 tweet.mediaDetails 索引 */
  index: number
  /** base64 data URI，如 data:image/jpeg;base64,/9j/... */
  dataUri: string
}

/** 允许服务端 fetch 的媒体 host（精确 hostname 匹配，杜绝 SSRF 内网探测）。 */
const ALLOWED_MEDIA_HOSTS = new Set(['pbs.twimg.com'])

/**
 * 校验图片 URL 的 host 在服务端 fetch 白名单内。与 /api/proxy/image 相比更严格：
 * proxy 靠路径后缀/子串匹配，本函数要求 hostname 精确命中（DR-5 服务端直拉 twimg）。
 */
export function assertAllowedMediaHost(url: string): string {
  const parsed = new URL(url)
  if (!ALLOWED_MEDIA_HOSTS.has(parsed.hostname)) {
    throw new Error(`Disallowed media host for server-side fetch: ${parsed.hostname}`)
  }
  return url
}

/** 与 getMediaUrl 相同的 format + name 变换，但服务端安全（无 useProxyMedia hook） */
export function buildMediaUrl(media: MediaDetails, size: MediaSize = 'small'): string {
  const url = new URL(media.media_url_https)
  const extension = url.pathname.split('.').pop()
  if (!extension) {
    return media.media_url_https
  }
  url.pathname = url.pathname.replace(`.${extension}`, '')
  url.searchParams.set('format', extension)
  url.searchParams.set('name', size)
  return url.toString()
}

const IMAGE_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export async function fetchImageDataUri(url: string): Promise<string> {
  // 服务端 fetch 前必须过 host 白名单（防 SSRF）
  assertAllowedMediaHost(url)
  const resp = await fetch(url, {
    headers: {
      'User-Agent': IMAGE_UA,
      'Referer': 'https://x.com/',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    },
  })
  if (!resp.ok) {
    throw new Error(`Image fetch failed: ${resp.status} ${url}`)
  }
  const contentType = resp.headers.get('Content-Type') || 'image/jpeg'
  const buf = Buffer.from(await resp.arrayBuffer())
  return `data:${contentType};base64,${buf.toString('base64')}`
}

/** 按 mediaIndexes 过滤 photo 并抓取，返回按请求顺序的 data URI 列表 */
export async function fetchMediaImages(
  mediaDetails: MediaDetails[],
  mediaIndexes: number[],
  size: MediaSize = 'small',
): Promise<FetchedImage[]> {
  const results: FetchedImage[] = []
  for (const index of mediaIndexes) {
    const media = mediaDetails[index]
    if (!media || media.type !== 'photo') {
      continue
    }
    const dataUri = await fetchImageDataUri(buildMediaUrl(media, size))
    results.push({ index, dataUri })
  }
  return results
}
