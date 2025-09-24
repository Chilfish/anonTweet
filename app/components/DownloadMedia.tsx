import type { EnrichedTweet } from '~/lib/react-tweet'
import type { Tweet } from '~/lib/react-tweet/api'
import FileSaver from 'file-saver'
import { DownloadIcon, LoaderIcon } from 'lucide-react'
import { useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { enrichTweet } from '~/lib/react-tweet'
import { formatDateFns } from '~/lib/react-tweet/date-utils'
import { useTranslationStore } from '~/lib/stores/translation'
import { Button } from './ui/button'

interface MediaItem {
  url: string
  name: string
}

function renameMedia(
  tweet: EnrichedTweet,
  url: string,
  type: 'photo' | 'video',
  idx: number,
): MediaItem {
  const id = tweet.id_str || Date.now()
  const suffix = idx ? `-${idx}` : ''
  const craetedAt = formatDateFns(tweet.created_at || Date.now(), { fmt: 'yyyymmdd_hhmmss' })
  const username = tweet.user.screen_name || 'unknown'
  const ext = type === 'video' ? 'mp4' : 'png'

  const filename = `${username}-${id}-${craetedAt}${suffix}.${ext}`

  const largeUrl = new URL(url)

  if (type === 'photo') {
    largeUrl.searchParams.set('format', ext)
    largeUrl.searchParams.set('name', 'large')
  }

  return {
    name: filename,
    url: largeUrl.href,
  }
}

function getMediaUrls(tweet: Tweet): MediaItem[] {
  const data = enrichTweet(tweet)
  const medias: MediaItem[] = []
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

async function downloadMediaItem({ url, name }: MediaItem): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      FileSaver.saveAs(url, name)
      setTimeout(resolve, 200)
    }
    catch (error) {
      reject(error)
    }
  })
}

async function downloadAllMedia(mediaUrls: MediaItem[]): Promise<void> {
  for (const mediaItem of mediaUrls) {
    await downloadMediaItem(mediaItem)
  }
}

export function DownloadMedia() {
  const { tweet, quotedTweet, parentTweets } = useTranslationStore()
  const [isDownloading, setIsDownloading] = useState(false)

  async function handleDownload() {
    if (isDownloading)
      return

    const mediaUrls = [tweet, quotedTweet, ...parentTweets]
      .flatMap(t => t && getMediaUrls(t))
      .filter((url): url is MediaItem => !!url)

    if (mediaUrls.length === 0)
      return

    console.log('Media urls:', mediaUrls)

    setIsDownloading(true)

    try {
      await downloadAllMedia(mediaUrls)
    }
    catch (error) {
      console.error('下载失败:', error)
    }
    finally {
      setIsDownloading(false)
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
        <p>{isDownloading ? '正在下载...' : '下载推文媒体'}</p>
      </TooltipContent>
    </Tooltip>
  )
}
