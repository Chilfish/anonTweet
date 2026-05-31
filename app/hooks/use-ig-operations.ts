import type { IGPost } from '~/types'
import { useCallback } from 'react'
import { downloadFiles } from '~/lib/downloader'
import { extractIGDownloadItems } from '~/lib/igDownloader'
import { toast } from '~/lib/utils'

/**
 * Instagram 帖子操作 hook。
 *
 * 提供：下载媒体、复制文本、复制 Markdown。
 * 截图由 useIGScreenshotAction 独立管理。
 */
export function useIGOperations(post: IGPost | null) {
  const downloadMedia = useCallback(async () => {
    if (!post)
      return

    const items = extractIGDownloadItems(post)
    if (items.length === 0) {
      toast.info('未检测到可下载的媒体资源')
      return
    }

    toast.info('正在解析并下载媒体...')
    try {
      await downloadFiles(items, {
        onError: (_error, filename) => {
          console.error(`[IG DownloadError] File: ${filename}`, _error)
          toast.error(`文件下载失败: ${filename}`)
        },
      })
      toast.success('下载任务结束', { description: `成功处理 ${items.length} 个文件` })
    }
    catch {
      toast.error('批量下载进程异常终止')
    }
  }, [post])

  const copyText = useCallback(async () => {
    if (!post?.description)
      return

    try {
      await navigator.clipboard.writeText(post.description)
      toast.success('已复制正文到剪贴板')
    }
    catch {
      toast.error('复制失败')
    }
  }, [post])

  const copyMarkdown = useCallback(async () => {
    if (!post)
      return

    try {
      const lines: string[] = [
        `# ${post.fullname || post.username} (@${post.username})`,
        '',
      ]

      if (post.description) {
        lines.push(post.description, '')
      }

      if (post.tags?.length) {
        lines.push(post.tags.map(t => `#${t}`).join('  '), '')
      }

      lines.push(
        `> ❤️ ${post.likes.toLocaleString()}  ·  🔗 [查看原文](${post.url})`,
        `> ${post.created_at ? new Date(post.created_at).toLocaleString('zh-CN') : ''}`,
      )

      await navigator.clipboard.writeText(lines.join('\n'))
      toast.success('已复制 Markdown 到剪贴板')
    }
    catch {
      toast.error('复制失败')
    }
  }, [post])

  return {
    downloadMedia,
    copyText,
    copyMarkdown,
  }
}
