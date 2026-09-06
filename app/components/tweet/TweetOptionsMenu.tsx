import {
  Download,
  EyeIcon,
  EyeOff,
  FileText,
  ImagePlus,
  LayoutGrid,
  MoreHorizontal,
  Rows4Icon,
  Settings,
  Share2,
} from 'lucide-react'
import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { SettingsPanel } from '~/components/settings/SettingsPanel'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { useScreenshotAction } from '~/hooks/use-screenshot-action'
import { useTweetOperations } from '~/hooks/use-tweet-operations'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import {
  useExcludeCommentsTweets,
  useTranslationUIActions,
  useUIState,
} from '~/lib/stores/hooks'

interface TweetOptionsMenuProps {
  disableActions: boolean
}

export function TweetOptionsMenu({ disableActions }: TweetOptionsMenuProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { isInlineMedia, setIsInlineMedia } = useAppConfigStore(
    useShallow(state => ({
      isInlineMedia: state.isInlineMedia,
      setIsInlineMedia: state.setIsInlineMedia,
    })),
  )
  const { showTranslationButton } = useUIState()
  const { setShowTranslationButton } = useTranslationUIActions()

  const {
    downloadMedia,
    copyMarkdown,
    copyTweetText,
    shareTweet,
  } = useTweetOperations()

  // AC-PWA-007：「分享截图」复用截图管线（整条线程），系统分享卡片图片、不支持回退下载
  const excludeCommentsTweets = useExcludeCommentsTweets()
  const { shareScreenshot, isCapturing: isSharingScreenshot } = useScreenshotAction({
    tweets: excludeCommentsTweets,
  })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={(
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" />
        )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="sr-only">更多选项</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-fit rounded-xl p-1.5 shadow-lg border border-muted">
          <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="menu-item-class">
            <Settings className="h-4 w-4 mr-2" />
            <span>设置</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={downloadMedia} disabled={disableActions} className="menu-item-class">
            <Download className="h-4 w-4 mr-2" />
            <span>下载媒体</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={shareTweet} disabled={disableActions} className="menu-item-class">
            <Share2 className="h-4 w-4 mr-2" />
            <span>分享</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => shareScreenshot(false)}
            disabled={disableActions || isSharingScreenshot}
            className="menu-item-class"
          >
            <ImagePlus className="h-4 w-4 mr-2" />
            <span>{isSharingScreenshot ? '截图中...' : '分享截图'}</span>
          </DropdownMenuItem>

          <DropdownMenuCheckboxItem checked={isInlineMedia} onCheckedChange={setIsInlineMedia} className="menu-item-class">
            {isInlineMedia ? <LayoutGrid className="h-4 w-4 mr-2" /> : <Rows4Icon className="h-4 w-4 mr-2" />}
            <span>
              媒体按
              {isInlineMedia ? '宫格' : '竖向'}
              排列
            </span>
          </DropdownMenuCheckboxItem>

          <DropdownMenuItem onClick={copyMarkdown} disabled={disableActions} className="menu-item-class">
            <FileText className="h-4 w-4 mr-2" />
            <span>复制 Markdown</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={copyTweetText} disabled={disableActions} className="menu-item-class">
            <FileText className="h-4 w-4 mr-2" />
            <span>复制正文文本</span>
          </DropdownMenuItem>

          <DropdownMenuCheckboxItem checked={!showTranslationButton} onCheckedChange={c => setShowTranslationButton(!c)} className="menu-item-class">
            {showTranslationButton ? <EyeIcon className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            <span>
              {showTranslationButton ? '隐藏' : '显示'}
              翻译按钮
            </span>
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsPanel open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  )
}
