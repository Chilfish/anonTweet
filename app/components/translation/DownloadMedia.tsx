import type { DownloadItem } from '~/lib/downloader'
import type { EnrichedTweet, MediaDetails } from '~/lib/react-tweet'
import { DownloadIcon, LoaderIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { downloadFiles } from '~/lib/downloader'
import { formatDate } from '~/lib/react-tweet/date-utils'
import { useTranslationStore } from '~/lib/stores/translation'
import { toast } from '~/lib/utils'

function renameMedia(
  tweet: EnrichedTweet,
  url: string,
  type: 'photo' | 'video',
  idx: number,
): DownloadItem {
  const id = tweet.id_str || Date.now()
  const suffix = idx ? `-${idx}` : ''
  const createdAt = formatDate(tweet.created_at || Date.now(), 'yyyymmdd_hhmmss')
  const username = tweet.user.screen_name || 'unknown'
  const ext = type === 'video' ? 'mp4' : 'png'

  const filename = `${username}-${id}-${createdAt}${suffix}.${ext}`

  const largeUrl = new URL(url)

  if (type === 'photo') {
    largeUrl.searchParams.set('format', ext)
    largeUrl.searchParams.set('name', 'large')
  }

  return {
    filename,
    url: largeUrl.href,
  }
}

function extractMediaUrls(mediaDetails: MediaDetails[] | undefined): string[] {
  if (!mediaDetails || !Array.isArray(mediaDetails)) {
    return []
  }

  return mediaDetails.map((media) => {
    switch (media.type) {
      case 'photo':
        return media.media_url_https

      case 'animated_gif':
        return media.video_info?.variants[0]?.url || ''

      case 'video':
        const mp4Variants = media.video_info?.variants.filter(
          v => v.content_type === 'video/mp4' && typeof v.bitrate === 'number',
        )

        if (!mp4Variants || mp4Variants.length === 0) {
          return ''
        }

        const bestVariant = mp4Variants.reduce((best, current) =>
          (current.bitrate! > best.bitrate!) ? current : best,
        )

        return bestVariant.url

      default:
        return ''
    }
  }).filter(url => url !== '')
}

const getMediaType = (url: string): 'photo' | 'video' => url.includes('video') ? 'video' : 'photo'

function getMediaUrls(tweet: EnrichedTweet): DownloadItem[] {
  const medias: DownloadItem[] = extractMediaUrls(tweet.mediaDetails)
    .map((url, idx) => renameMedia(tweet, url, getMediaType(url), idx))

  return medias
}

export function DownloadMedia() {
  const { tweets } = useTranslationStore()
  const [isDownloading, setIsDownloading] = useState(false)

  async function handleDownload() {
    if (isDownloading)
      return

    const mediaUrls = tweets
      .flatMap(t => t.quotedTweet ? [t.quotedTweet, t] : [t])
      .flatMap(t => t && getMediaUrls(t))
      .filter((url): url is DownloadItem => !!url)

    if (mediaUrls.length === 0)
      return

    console.log('Media urls:', mediaUrls)

    setIsDownloading(true)
    toast.info('开始下载媒体...')

    try {
      await downloadFiles(mediaUrls, {
        onError: (error, filename) => {
          console.error(`下载失败: ${filename}`, error)
          toast.error(`下载失败: ${filename}`, {
            description: error instanceof Error ? error.message : '未知错误',
          })
        },
      })
      toast.success(`下载完成`, {
        description: `共下载 ${mediaUrls.length} 个文件`,
      })
    }
    catch (error) {
      console.error('下载失败:', error)
      toast.error(`下载失败`, {
        description: error instanceof Error ? error.message : '未知错误',
      })
    }
    finally {
      setTimeout(() => {
        setIsDownloading(false)
      }, 1500)
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={(
          <Button
            onClick={() => handleDownload()}
            size="icon"
            variant="ghost"
            disabled={isDownloading}
          />
        )}
      >

        {isDownloading
          ? <LoaderIcon className="animate-spin" />
          : <DownloadIcon />}
      </TooltipTrigger>
      <TooltipContent>
        <p>下载推文媒体</p>
      </TooltipContent>
    </Tooltip>
  )
}
