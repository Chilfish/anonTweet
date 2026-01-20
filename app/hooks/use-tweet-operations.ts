import type { TweetData } from '~/types'
import { useState } from 'react'
import { extractDownloadItemsFromTweets } from '~/components/translation/DownloadMedia'
import { downloadFiles } from '~/lib/downloader'
import { fetcher } from '~/lib/fetcher'
import { generateMarkdownFromTweets } from '~/lib/markdown'
import { useTranslationStore } from '~/lib/stores/translation'
import { toast } from '~/lib/utils'

export function useTweetOperations() {
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const { tweets, mainTweet, appendTweets } = useTranslationStore()

  const loadComments = async () => {
    if (!mainTweet)
      return
    setIsLoadingComments(true)
    try {
      const { data } = await fetcher.get<TweetData>(`/api/tweet/replies/${mainTweet.id_str}`)
      if (data && data.length > 0) {
        appendTweets(data)
        toast.success(`已获取 ${data.length} 条评论`)
      }
      else {
        toast.info('未找到更多评论')
      }
    }
    catch (error) {
      console.error('Failed to load comments:', error)
      toast.error('加载评论失败', { description: `${error}` })
    }
    finally {
      setIsLoadingComments(false)
    }
  }

  const downloadMedia = async () => {
    const mediaItems = extractDownloadItemsFromTweets(tweets)
    if (mediaItems.length === 0) {
      toast.info('未检测到可下载的媒体资源')
      return
    }

    toast.info('正在解析并下载媒体...')
    try {
      await downloadFiles(mediaItems, {
        onError: (error, filename) => {
          console.error(`[DownloadError] File: ${filename}`, error)
          toast.error(`文件下载失败: ${filename}`)
        },
      })
      toast.success('下载任务结束', { description: `成功处理 ${mediaItems.length} 个文件` })
    }
    catch (globalError) {
      toast.error('批量下载进程异常终止')
    }
  }

  const copyMarkdown = async () => {
    try {
      const markdown = generateMarkdownFromTweets(tweets)
      await navigator.clipboard.writeText(markdown)
      toast.success('已复制 Markdown 到剪贴板')
    }
    catch (error) {
      toast.error('复制失败', { description: '请确保浏览器可写剪贴板' })
    }
  }

  return {
    isLoadingComments,
    loadComments,
    downloadMedia,
    copyMarkdown,
    hasTweets: tweets.length > 0,
    hasMainTweet: !!mainTweet,
  }
}
