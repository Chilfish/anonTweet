import type { DownloadItem } from '~/lib/downloader'
import type { DownloadImageSize } from '~/lib/stores/appConfig'
import type { EnrichedTweet, MediaDetails } from '~/types'
import { DownloadIcon, Loader2 } from 'lucide-react' // 使用 Loader2 替代 LoaderIcon (更现代的命名习惯)
import { useCallback, useState } from 'react'
import { Button } from '~/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'

import { downloadFiles } from '~/lib/downloader'
import { formatDate } from '~/lib/react-tweet'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { useTweets } from '~/lib/stores/hooks'
import { toast } from '~/lib/utils'

const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif|avif)$/i

/** 从图片 URL 的路径扩展名（或 format 查询参数）推导真实格式，用于原图模式生成文件名 */
function getImageExt(url: URL): string {
  const match = url.pathname.match(IMAGE_EXT_RE)
  const ext = match?.[1]?.toLowerCase()
  if (ext) {
    return ext === 'jpeg'
      ? 'jpg'
      : ext
  }
  const format = url.searchParams.get('format')?.toLowerCase()
  return format ?? 'jpg'
}

type MediaType = 'photo' | 'video' | 'animated_gif'

interface ExtractedMedia {
  url: string
  type: MediaType
  originalIndex: number
}

/**
 * 从媒体详情中提取最高质量的变体
 * 使用严格的类型守卫和 reduce 算法确保 O(n) 复杂度
 */
function getBestVideoVariant(media: MediaDetails): string | null {
  if (media.type !== 'video') {
    return null
  }

  const variants = media.video_info?.variants
  if (!variants?.length)
    return null

  // 优先选择 MP4 且 bitrate 最高的版本
  const mp4Variants = variants.filter(
    (v): v is typeof v & { bitrate: number } =>
      v.content_type === 'video/mp4' && typeof v.bitrate === 'number',
  )

  if (mp4Variants.length === 0)
    return null

  const url = mp4Variants.reduce((prev, curr) =>
    curr.bitrate > prev.bitrate
      ? curr
      : prev,
  ).url

  return `https://proxy.chilfish.top/${url}`
}

/**
 * 构造标准化的下载文件名
 * 保证确定性：相同输入必得到相同文件名
 */
function createDownloadItem(
  tweet: EnrichedTweet,
  url: string,
  type: MediaType,
  index: number,
  imageSize: DownloadImageSize,
): DownloadItem {
  // 防御性编程：如果没有 ID，说明数据源已损坏，这里做降级处理但记录警告
  const id = tweet.id_str ?? 'unknown-id'
  const username = tweet.user.screen_name ?? 'unknown-user'

  // 使用 tweet 原始时间，若无则回退，但不建议使用 Date.now() 混淆历史数据
  const tweetDate = tweet.created_at
    ? new Date(tweet.created_at)
    : new Date()
  const formattedDate = formatDate(tweetDate, 'yyyymmdd_hhmmss')

  const suffix = index > 0
    ? `-${index}`
    : ''

  const downloadUrl = new URL(url)
  if (type === 'photo') {
    if (imageSize === 'orig') {
      // 原图：保留原始格式，仅请求原始分辨率（可能为非 jpg 的 png/webp）
      downloadUrl.searchParams.set('name', 'orig')
    }
    else {
      downloadUrl.searchParams.set('format', 'jpg') // 强制统一为 jpg
      downloadUrl.searchParams.set('name', 'large') // 长边封顶 2048
    }
  }

  const ext = type !== 'photo'
    ? 'mp4'
    : imageSize === 'orig'
      ? getImageExt(downloadUrl)
      : 'jpg'

  const filename = `${username}-${id}-${formattedDate}${suffix}.${ext}`

  return {
    filename,
    url: downloadUrl.href,
  }
}

/**
 * 主提取逻辑
 * 展平 Quoted Tweet 结构并聚合所有媒体
 */
export function extractDownloadItemsFromTweets(
  tweets: EnrichedTweet[],
  imageSize: DownloadImageSize = 'large',
  includeCardImages = true,
): DownloadItem[] {
  const allTweets = tweets.flatMap(t => t.quotedTweet
    ? [t.quotedTweet, t]
    : [t])

  return allTweets.flatMap((tweet) => {
    const items: ExtractedMedia[] = []

    tweet.mediaDetails?.forEach((media, idx) => {
      let url: string | null = null

      switch (media.type) {
        case 'photo':
          url = media.media_url_https
          break
        case 'animated_gif':
          // GIF 在 Twitter API 中通常作为无音频的 MP4 变体存在
          url = media.video_info?.variants[0]?.url ?? null
          break
        case 'video':
          url = getBestVideoVariant(media)
          break
      }

      if (url)
        items.push({ url, type: media.type as MediaType, originalIndex: idx })
    })

    // 链接卡片图片（普通卡片或 trending 卡片主图）
    const cardImageUrl = tweet.card?.trending?.imageUrl || tweet.card?.imageUrl
    if (includeCardImages && cardImageUrl) {
      items.push({ url: cardImageUrl, type: 'photo', originalIndex: items.length })
    }

    return items.map(item =>
      createDownloadItem(tweet, item.url, item.type, item.originalIndex, imageSize),
    )
  })
}

export function DownloadMedia() {
  const tweets = useTweets()
  const downloadImageSize = useAppConfigStore(s => s.downloadImageSize)
  const downloadCardImages = useAppConfigStore(s => s.downloadCardImages)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = useCallback(async () => {
    const mediaItems = extractDownloadItemsFromTweets(tweets, downloadImageSize, downloadCardImages)

    if (mediaItems.length === 0) {
      toast.info('未检测到可下载的媒体资源')
      return
    }

    console.debug(`[MediaDownloader] Preparing to download ${mediaItems.length} items.`, mediaItems)

    setIsDownloading(true)
    toast.info('正在解析并下载媒体...')

    try {
      await downloadFiles(mediaItems, {
        onError: (error, filename) => {
          console.error(`[DownloadError] File: ${filename}`, error)
          toast.error(`文件下载失败: ${filename}`)
        },
      })

      toast.success(`下载任务结束`, {
        description: `成功处理 ${mediaItems.length} 个文件`,
      })
    }
    catch (globalError) {
      console.error('[MediaDownloader] Critical Failure', globalError)
      toast.error('批量下载进程异常终止', {
        description: globalError instanceof Error
          ? globalError.message
          : '网络或权限错误',
      })
    }
    setIsDownloading(false)
  }, [tweets, downloadImageSize, downloadCardImages])

  return (
    <Tooltip>
      <TooltipTrigger render={(
        <Button
          onClick={handleDownload}
          size="icon"
          variant="ghost"
          disabled={isDownloading || tweets.length === 0}
          aria-label="下载所有媒体"
        />
      )}
      >
        {isDownloading
          ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            )
          : (
              <DownloadIcon className="h-4 w-4" />
            )}
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>下载本页所有推文媒体</p>
      </TooltipContent>
    </Tooltip>
  )
}
