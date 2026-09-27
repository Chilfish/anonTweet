import type { EnrichedTweet, TweetArticle } from '~/types'
import { Download, FileText, MoreHorizontal, Settings, Share2 } from 'lucide-react'
import { useState } from 'react'
import { SettingsPanel } from '~/components/settings/SettingsPanel'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { articleToMarkdown, articleToText } from '~/lib/article/markdown'
import { downloadFiles } from '~/lib/downloader'
import { shareOut } from '~/lib/share'
import { toast } from '~/lib/utils'

interface ArticleOptionsMenuProps {
  article: TweetArticle
  tweet: EnrichedTweet
}

interface ArticleImageItem {
  url: string
  caption?: string
}

/** 收集文章内图片（封面 + 图片块），按 url 去重 */
function collectImages(article: TweetArticle): ArticleImageItem[] {
  const items: ArticleImageItem[] = []
  if (article.coverImage)
    items.push({ url: article.coverImage.url })

  for (const block of article.blocks ?? []) {
    if (block.type === 'image')
      items.push({ url: block.media.url, caption: block.caption })
  }

  return items.filter((item, index) => items.findIndex(i => i.url === item.url) === index)
}

/**
 * 文章阅读页的更多操作：设置 / 分享 / 复制 / 下载图片。
 * 与推文页的 `TweetOptionsMenu` 对齐，但作用于文章数据（不经翻译 store）。
 */
export function ArticleOptionsMenu({ article, tweet }: ArticleOptionsMenuProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleShare = async () => {
    const result = await shareOut({
      title: article.title || 'X 长文',
      text: article.previewText ?? '',
      url: article.url,
    })
    if (result === 'copied')
      toast.success('已复制原文链接', { description: '当前浏览器不支持系统分享' })
    else if (result === 'failed')
      toast.error('分享失败', { description: '请重试' })
  }

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`已复制${label}`)
    }
    catch {
      toast.error('复制失败', { description: '请确保浏览器可写剪贴板' })
    }
  }

  const handleDownloadImages = async () => {
    const images = collectImages(article)
    if (images.length === 0) {
      toast.info('文章内没有可下载的图片')
      return
    }

    const items = images.map((image, index) => ({
      url: image.url,
      filename: `${tweet.user.screen_name}-${tweet.id_str}-article-${index + 1}.jpg`,
    }))

    toast.info(`正在下载 ${items.length} 张图片...`)
    await downloadFiles(items, {
      onError: (error, filename) => {
        console.error(`[ArticleDownload] ${filename}`, error)
        toast.error(`下载失败：${filename}`)
      },
    })
    toast.success('下载完成')
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            />
          )}
        >
          <MoreHorizontal className="size-5" />
          <span className="sr-only">更多选项</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-fit rounded-xl border border-muted p-1.5 shadow-lg">
          <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
            <Settings className="mr-2 size-4" />
            <span>设置</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="mr-2 size-4" />
            <span>分享</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => copy(articleToText(article), '正文文本')}>
            <FileText className="mr-2 size-4" />
            <span>复制正文文本</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => copy(articleToMarkdown(article), ' Markdown')}>
            <FileText className="mr-2 size-4" />
            <span>复制 Markdown</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadImages}>
            <Download className="mr-2 size-4" />
            <span>下载图片</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsPanel open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  )
}
