import type { DownloadItem } from '~/lib/downloader'
import type { EnrichedTweet } from '~/lib/react-tweet'
import { DownloadIcon, LoaderIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { downloadFiles } from '~/lib/downloader'
import { formatDate } from '~/lib/react-tweet/date-utils'
import { useTranslationStore } from '~/lib/stores/translation'
import { Button } from './ui/button'

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

function getMediaUrls(data: EnrichedTweet): DownloadItem[] {
  const medias: DownloadItem[] = []
  const photos = (data.photos || []).map((photo, idx) => renameMedia(data, photo.url, 'photo', idx))
  medias.push(...photos)

  if (data.video?.videoId) {
    const videoUrl = data.video.variants.at(-1)?.src
    if (videoUrl) {
      medias.push(renameMedia(data, videoUrl, 'video', 0))
    }
  }

  return medias
}

export function DownloadMedia() {
  const { tweet, quotedTweet, parentTweets } = useTranslationStore()
  const [isDownloading, setIsDownloading] = useState(false)

  async function handleDownload() {
    if (isDownloading)
      return

    const mediaUrls = [tweet, quotedTweet, ...parentTweets]
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
      <TooltipTrigger asChild>
        <Button
          onClick={() => tweet && handleDownload()}
          size="icon"
          variant="ghost"
          disabled={isDownloading}
        >
          {isDownloading
            ? <LoaderIcon className="animate-spin" />
            : <DownloadIcon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>下载推文媒体</p>
      </TooltipContent>
    </Tooltip>
  )
}
