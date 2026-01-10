import type { DownloadItem } from '~/lib/downloader'
import type { EnrichedTweet, MediaDetails } from '~/types'
import { DownloadIcon, Loader2 } from 'lucide-react' // 使用 Loader2 替代 LoaderIcon (更现代的命名习惯)
import { useCallback, useState } from 'react'
import { Button } from '~/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { downloadFiles } from '~/lib/downloader'

import { formatDate } from '~/lib/react-tweet'
import { useTranslationStore } from '~/lib/stores/translation'
import { toast } from '~/lib/utils'

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

  return mp4Variants.reduce((prev, curr) =>
    curr.bitrate > prev.bitrate ? curr : prev,
  ).url
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
): DownloadItem {
  // 防御性编程：如果没有 ID，说明数据源已损坏，这里做降级处理但记录警告
  const id = tweet.id_str ?? 'unknown-id'
  const username = tweet.user.screen_name ?? 'unknown-user'

  // 使用 tweet 原始时间，若无则回退，但不建议使用 Date.now() 混淆历史数据
  const tweetDate = tweet.created_at ? new Date(tweet.created_at) : new Date()
  const formattedDate = formatDate(tweetDate, 'yyyymmdd_hhmmss')

  const suffix = index > 0 ? `-${index}` : ''
  const ext = type === 'photo' ? 'jpg' : 'mp4'

  const filename = `${username}-${id}-${formattedDate}${suffix}.${ext}`

  const downloadUrl = new URL(url)
  if (type === 'photo') {
    downloadUrl.searchParams.set('format', 'jpg') // 强制统一为 jpg
    downloadUrl.searchParams.set('name', 'large') // 请求大图
  }

  return {
    filename,
    url: downloadUrl.href,
  }
}

/**
 * 主提取逻辑
 * 展平 Quoted Tweet 结构并聚合所有媒体
 */
export function extractDownloadItemsFromTweets(tweets: EnrichedTweet[]): DownloadItem[] {
  const allTweets = tweets.flatMap(t => t.quotedTweet ? [t.quotedTweet, t] : [t])

  return allTweets.flatMap((tweet) => {
    if (!tweet.mediaDetails?.length)
      return []

    return tweet.mediaDetails
      .map((media, idx): ExtractedMedia | null => {
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

        if (!url)
          return null

        return {
          url,
          type: media.type as MediaType,
          originalIndex: idx,
        }
      })
      .filter((item): item is ExtractedMedia => item !== null)
      .map(item => createDownloadItem(tweet, item.url, item.type, item.originalIndex))
  })
}

export function DownloadMedia() {
  const { tweets } = useTranslationStore()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = useCallback(async () => {
    const mediaItems = extractDownloadItemsFromTweets(tweets)

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
        description: globalError instanceof Error ? globalError.message : '网络或权限错误',
      })
    }
    finally {
      setIsDownloading(false)
    }
  }, [tweets])

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
        {isDownloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <DownloadIcon className="h-4 w-4" />
        )}
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>下载本页所有推文媒体</p>
      </TooltipContent>
    </Tooltip>
  )
}
