import {
  Copy,
  Download,
  FileText,
  ImagePlus,
  MoreHorizontal,
  Settings,
  Share2,
} from 'lucide-react'
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

interface IGOptionsMenuProps {
  disableActions: boolean
  onDownload: () => void
  onShare: () => void
  onShareScreenshot: () => void
  onCopyText: () => void
  onCopyMarkdown: () => void
  /** 截图进行中（禁用分享截图项，防止并发截图）。 */
  isCapturing?: boolean
}

/**
 * Instagram 三点菜单。
 *
 * 收纳低频操作：设置、下载媒体、分享、分享截图、复制文本、复制 Markdown。
 */
export function IGOptionsMenu({
  disableActions,
  onDownload,
  onShare,
  onShareScreenshot,
  onCopyText,
  onCopyMarkdown,
  isCapturing = false,
}: IGOptionsMenuProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(
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
            className="menu-item-class"
          >
            <Settings className="h-4 w-4 mr-2" />
            <span>设置</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={onDownload}
            disabled={disableActions}
            className="menu-item-class"
          >
            <Download className="h-4 w-4 mr-2" />
            <span>下载媒体</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={onShare}
            disabled={disableActions}
            className="menu-item-class"
          >
            <Share2 className="h-4 w-4 mr-2" />
            <span>分享</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={onShareScreenshot}
            disabled={disableActions || isCapturing}
            className="menu-item-class"
          >
            <ImagePlus className="h-4 w-4 mr-2" />
            <span>{isCapturing ? '截图中...' : '分享截图'}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={onCopyMarkdown}
            disabled={disableActions}
            className="menu-item-class"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span>复制 Markdown</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={onCopyText}
            disabled={disableActions}
            className="menu-item-class"
          >
            <Copy className="h-4 w-4 mr-2" />
            <span>复制正文文本</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsPanel open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  )
}
