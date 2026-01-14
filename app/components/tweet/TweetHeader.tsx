import {
  Download,
  EyeIcon,
  EyeOff,
  FileText,
  LayoutGrid,
  MoreHorizontal,
  Rows4Icon,
  Settings,
} from 'lucide-react'
import { useState } from 'react'
import { SettingsPanel } from '~/components/settings/SettingsPanel'
import { BackButton } from '~/components/translation/BackButton'
import { extractDownloadItemsFromTweets } from '~/components/translation/DownloadMedia'
import { SaveAsImageButton } from '~/components/translation/saveAsImage'
import { ToggleTransButton } from '~/components/translation/ToggleTransButton'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { downloadFiles } from '~/lib/downloader'
import { generateMarkdownFromTweets } from '~/lib/markdown'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { useTranslationStore } from '~/lib/stores/translation'
import { toast } from '~/lib/utils'

export function TweetHeader() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const {
    tweets,
    showTranslationButton,
    setShowTranslationButton,
  } = useTranslationStore()

  const { isInlineMedia, setIsInlineMedia } = useAppConfigStore()

  const handleDownload = async () => {
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
          toast.error(`文件下载失败: ${filename}`, {
            description: `${error}`,
          })
        },
      })
      toast.success(`下载任务结束`, {
        description: `成功处理 ${mediaItems.length} 个文件`,
      })
    }
    catch (globalError) {
      console.error('[MediaDownloader] Critical Failure', globalError)
      toast.error('批量下载进程异常终止', {
        description: `${globalError}`,
      })
    }
  }

  const handleCopyMarkdown = async () => {
    try {
      const markdown = generateMarkdownFromTweets(tweets)
      await navigator.clipboard.writeText(markdown)
      toast.success('已复制 Markdown 到剪贴板')
    }
    catch (error) {
      console.error('Failed to copy markdown:', error)
      toast.error('复制失败', {
        description: `请确保浏览器可写剪贴板。${error}`,
      })
    }
  }

  return (
    <div className="mb-4 flex w-full items-center justify-between gap-2 px-1 py-2 sm:mb-6 sm:px-0">
      <BackButton />

      <div className="flex items-center gap-1 sm:gap-2">
        <ToggleTransButton />
        <SaveAsImageButton />

        <DropdownMenu>
          <DropdownMenuTrigger render={(
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            />
          )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="sr-only">更多选项</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-fit rounded-xl p-1.5 shadow-lg border border-muted"
          >
            <DropdownMenuItem
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium focus:bg-muted/50"
            >
              <Settings className="h-4 w-4" />
              <span>设置</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleDownload}
              disabled={tweets.length === 0}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium focus:bg-muted/50"
            >
              <Download className="h-4 w-4" />
              <span>下载媒体</span>
            </DropdownMenuItem>

            <DropdownMenuCheckboxItem
              checked={isInlineMedia}
              onCheckedChange={setIsInlineMedia}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium focus:bg-muted/50"
            >
              <span className="flex items-center gap-2">
                {
                  isInlineMedia
                    ? <LayoutGrid className="h-4 w-4" />
                    : <Rows4Icon className="h-4 w-4" />
                }
                <span>
                  媒体按
                  {isInlineMedia ? '宫格' : '竖向'}
                  排列
                </span>
              </span>
            </DropdownMenuCheckboxItem>

            <DropdownMenuItem
              onClick={handleCopyMarkdown}
              disabled={tweets.length === 0}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium focus:bg-muted/50"
            >
              <FileText className="h-4 w-4" />
              <span>复制为Markdown</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 opacity-50" />

            <DropdownMenuCheckboxItem
              checked={!showTranslationButton}
              onCheckedChange={checked => setShowTranslationButton(!checked)}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium focus:bg-muted/50"
            >
              <span className="flex items-center gap-2">
                {
                  showTranslationButton
                    ? <EyeIcon className="h-4 w-4" />
                    : <EyeOff className="h-4 w-4" />
                }
                <span>
                  {showTranslationButton ? '隐藏' : '显示'}
                  翻译按钮
                </span>
              </span>
            </DropdownMenuCheckboxItem>

          </DropdownMenuContent>
        </DropdownMenu>

        <SettingsPanel
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
        />
      </div>
    </div>
  )
}
