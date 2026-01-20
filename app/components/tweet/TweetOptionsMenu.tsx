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
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { useTranslationStore } from '~/lib/stores/translation'

interface TweetOptionsMenuProps {
  onDownload: () => void
  onCopyMarkdown: () => void
  disableActions: boolean
}

export function TweetOptionsMenu({ onDownload, onCopyMarkdown, disableActions }: TweetOptionsMenuProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { isInlineMedia, setIsInlineMedia } = useAppConfigStore()
  const { showTranslationButton, setShowTranslationButton } = useTranslationStore()

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

          <DropdownMenuItem onClick={onDownload} disabled={disableActions} className="menu-item-class">
            <Download className="h-4 w-4 mr-2" />
            <span>下载媒体</span>
          </DropdownMenuItem>

          <DropdownMenuCheckboxItem checked={isInlineMedia} onCheckedChange={setIsInlineMedia} className="menu-item-class">
            {isInlineMedia ? <LayoutGrid className="h-4 w-4 mr-2" /> : <Rows4Icon className="h-4 w-4 mr-2" />}
            <span>
              媒体按
              {isInlineMedia ? '宫格' : '竖向'}
              排列
            </span>
          </DropdownMenuCheckboxItem>

          <DropdownMenuItem onClick={onCopyMarkdown} disabled={disableActions} className="menu-item-class">
            <FileText className="h-4 w-4 mr-2" />
            <span>复制 Markdown</span>
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
