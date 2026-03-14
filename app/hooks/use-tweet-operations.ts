import type { TweetData } from '~/types'
import { useEffect, useState } from 'react'
import { extractDownloadItemsFromTweets } from '~/components/translation/DownloadMedia'
import { downloadFiles } from '~/lib/downloader'
import { fetcher } from '~/lib/fetcher'
import { generateMarkdownFromTweets, generateText } from '~/lib/markdown'
import { useCommentIds, useMainTweet, useTranslationActions, useTranslations, useTweets } from '~/lib/stores/hooks'
import { materializeTweetsWithManualTranslations } from '~/lib/translation/materialize'
import { toast } from '~/lib/utils'

interface RepliesResponse {
  tweets: TweetData
  nextCursor: string | null
}

export function useTweetOperations() {
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [repliesCursor, setRepliesCursor] = useState<string | null>(null)
  const tweets = useTweets()
  const mainTweet = useMainTweet()
  const commentIds = useCommentIds()
  const translations = useTranslations()
  const { appendTweets, setCommentIds } = useTranslationActions()

  useEffect(() => {
    setRepliesCursor(null)
  }, [mainTweet?.id_str])

  const loadComments = async (): Promise<void> => {
    if (!mainTweet)
      return

    if (commentIds.length > 0) {
      toast.info('评论已加载', repliesCursor ? { description: '可在评论区底部继续加载更多' } : undefined)
      return
    }

    setIsLoadingComments(true)
    try {
      const { data } = await fetcher.get<RepliesResponse>(`/api/tweet/replies/${mainTweet.id_str}`)
      const tweets = data?.tweets || []
      setRepliesCursor(data?.nextCursor || null)

      if (tweets.length > 0) {
        appendTweets(tweets)
        setCommentIds(tweets.map(tweet => tweet.id_str))
        toast.success(`已获取 ${tweets.length} 条评论`, {
          description: '默认仅筛选出与博主有互动的回复',
        })
      }
      else {
        toast.info('未找到更多评论', {
          description: '默认仅会筛选出与博主有互动的回复',
        })
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

  const loadMoreComments = async (): Promise<void> => {
    if (!mainTweet || !repliesCursor)
      return

    setIsLoadingComments(true)
    try {
      const url = `/api/tweet/replies/${mainTweet.id_str}?cursor=${encodeURIComponent(repliesCursor)}`
      const { data } = await fetcher.get<RepliesResponse>(url)

      const tweets = data?.tweets || []
      const next = data?.nextCursor || null
      setRepliesCursor(next && next !== repliesCursor ? next : null)

      if (tweets.length > 0) {
        appendTweets(tweets)

        const merged = new Set([...commentIds, ...tweets.map(tweet => tweet.id_str)])
        setCommentIds([...merged])

        toast.success(`已加载更多 ${tweets.length} 条评论`)
      }
      else {
        toast.info('暂无更多评论')
      }
    }
    catch (error) {
      console.error('Failed to load more comments:', error)
      toast.error('加载更多评论失败', { description: `${error}` })
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
      const viewTweets = materializeTweetsWithManualTranslations(tweets, translations)
      const markdown = generateMarkdownFromTweets(viewTweets)
      await navigator.clipboard.writeText(markdown)
      toast.success('已复制 Markdown 到剪贴板')
    }
    catch (error) {
      toast.error('复制失败', { description: '请确保浏览器可写剪贴板' })
    }
  }

  const copyTweetText = async () => {
    try {
      const viewTweets = materializeTweetsWithManualTranslations(tweets, translations)
      const text = generateText(viewTweets[0]!)
      await navigator.clipboard.writeText(text)
      toast.success('已复制正文到剪贴板')
    }
    catch (error) {
      toast.error('复制失败', { description: '请确保浏览器可写剪贴板' })
    }
  }

  return {
    isLoadingComments,
    loadComments,
    loadMoreComments,
    hasMoreComments: !!repliesCursor,
    copyTweetText,
    downloadMedia,
    copyMarkdown,
    hasTweets: tweets.length > 0,
    hasMainTweet: !!mainTweet,
  }
}
