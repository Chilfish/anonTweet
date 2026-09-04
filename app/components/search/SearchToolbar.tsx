import type { RefObject } from 'react'
import type { EnrichedTweet } from '~/types'
import {
  Download,
  FileText,
  LayoutGrid,
  MoreHorizontal,
  Rows4Icon,
  Settings,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { SettingsPanel } from '~/components/settings/SettingsPanel'
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
import { useScreenshotAction } from '~/hooks/use-screenshot-action'
import { useTweetOperations } from '~/hooks/use-tweet-operations'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { useTranslationUIActions, useUIState } from '~/lib/stores/hooks'

interface SearchToolbarProps {
  /** 当前搜索结果（全选/计数、文件名兜底、下载/复制数据源） */
  tweets: EnrichedTweet[]
  /** 结果列表容器 ref（截图捕获节点） */
  listRef: RefObject<HTMLDivElement | null>
}

/** 更多菜单：翻译设置 + 对当前搜索结果整体的下载/复制/媒体排列 */
function SearchOptionsMenu({ tweets }: { tweets: EnrichedTweet[] }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { isInlineMedia, setIsInlineMedia } = useAppConfigStore(
    useShallow(state => ({
      isInlineMedia: state.isInlineMedia,
      setIsInlineMedia: state.setIsInlineMedia,
    })),
  )
  // 搜索结果整体作为数据源（不经过全局 store），下载/复制直接作用于列表
  const { downloadMedia, copyMarkdown, copyTweetText } = useTweetOperations({
    tweets,
    mainTweet: null,
  })

  return (
    <>
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
        <DropdownMenuContent align="end" className="w-fit rounded-xl p-1.5 shadow-lg border border-muted">
          <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="menu-item-class">
            <Settings className="h-4 w-4 mr-2" />
            <span>翻译设置</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={downloadMedia} className="menu-item-class">
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

          <DropdownMenuItem onClick={copyMarkdown} className="menu-item-class">
            <FileText className="h-4 w-4 mr-2" />
            <span>复制 Markdown</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={copyTweetText} className="menu-item-class">
            <FileText className="h-4 w-4 mr-2" />
            <span>复制正文文本</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsPanel open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  )
}

/**
 * 搜索结果页的页级操作条：复用详情页「翻译模式切换」全局开关 + 搜索场景的截图入口。
 *
 * - ToggleTransButton：全局翻译显示/隐藏、双语/仅译文，对全部卡片即时生效；
 * - 截图全部：捕获整个结果列表容器（长截图），翻译按钮在截图中自动隐藏；
 * - 选择推文截图：跨卡片勾选（复用全局选择模式，`isCapturingSelected` 自动隐藏未选卡片）；
 * - 更多菜单：翻译设置（SettingsPanel，全局能力）+ 对列表整体的下载/复制/媒体排列。
 *
 * 截图/下载/复制能力通过 `useScreenshotAction` / `useTweetOperations` 的参数化
 * （captureRef / mainTweetOverride / syncTranslations=false，tweets 数据覆写）复用
 * 详情页链路，不复制业务逻辑。
 */
export function SearchToolbar({ tweets, listRef }: SearchToolbarProps) {
  const { isSelectionMode, selectedTweetIds } = useUIState()
  const { toggleSelectionMode, toggleTweetSelection } = useTranslationUIActions()

  const { handleScreenshot, isCapturing } = useScreenshotAction({
    tweets,
    captureRef: listRef,
    mainTweetOverride: tweets[0] ?? null,
    syncTranslations: false,
  })

  const ids = useMemo(() => tweets.map(tweet => tweet.id_str), [tweets])
  const selectedSet = useMemo(() => new Set(selectedTweetIds), [selectedTweetIds])
  const selectedCount = ids.filter(id => selectedSet.has(id)).length
  const isAllSelected = ids.length > 0 && selectedCount === ids.length

  const toggleSelectAll = () => {
    const select = !isAllSelected
    ids.forEach((id) => {
      if (selectedSet.has(id) !== select)
        toggleTweetSelection(id)
    })
  }

  return (
    <div className="flex w-full max-w-[600px] items-center justify-between gap-2 mx-auto">
      <ToggleTransButton size="sm" />

      <div className="flex items-center gap-1.5">
        {isSelectionMode ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              disabled={isCapturing}
            >
              {isAllSelected ? '全不选' : '全选'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toggleSelectionMode(false)}
              disabled={isCapturing}
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={() => handleScreenshot(true)}
              disabled={isCapturing}
            >
              {isCapturing ? '处理中...' : `截图 (${selectedCount})`}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleScreenshot(false)}
              disabled={isCapturing}
            >
              {isCapturing ? '处理中...' : '截图全部'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleSelectionMode(true)}
              disabled={isCapturing}
            >
              选择推文截图
            </Button>
          </>
        )}

        <SearchOptionsMenu tweets={tweets} />
      </div>
    </div>
  )
}
