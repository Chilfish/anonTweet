import {
  Copy,
  Download,
  FileText,
  MoreHorizontal,
  Settings,
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
  onCopyText: () => void
  onCopyMarkdown: () => void
}

/**
 * Instagram 三点菜单。
 *
 * 收纳低频操作：设置、下载媒体、复制文本、复制 Markdown。
 */
export function IGOptionsMenu({
  disableActions,
  onDownload,
  onCopyText,
  onCopyMarkdown,
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
