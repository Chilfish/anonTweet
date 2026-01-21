import type { ComponentProps } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { useScreenshotAction } from '~/hooks/use-screenshot-action'
import { useTranslationStore } from '~/lib/stores/translation'

function SelectionModeActions({
  onConfirm,
  onCancel,
  onToggleSelectAll,
  isAllSelected,
  count,
  disabled,
}: any) {
  return (
    <div className="flex gap-1">
      <Button variant="outline" onClick={onToggleSelectAll} disabled={disabled}>
        {isAllSelected ? '全不选' : '全选'}
      </Button>
      <Button variant="secondary" onClick={onCancel} disabled={disabled}>
        取消
      </Button>
      <Button onClick={onConfirm} disabled={disabled}>
        截图 (
        {count}
        )
      </Button>
    </div>
  )
}

function DropdownActions({
  onFullScreenshot,
  onManualSelect,
  disabled,
  buttonProps,
}: any) {
  const [open, setOpen] = useState(false)
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger render={<Button {...buttonProps} disabled={disabled} />}>
        截图
        {open ? (
          <ChevronUpIcon className="size-4" />
        ) : (
          <ChevronDownIcon className="size-4" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onFullScreenshot}>
          截图所有推文
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onManualSelect}>
          选择推文截图
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SaveAsImageButton(props: ComponentProps<typeof Button>) {
  const {
    tweets,
    mainTweet,
    commentsCount,
    isSelectionMode,
    toggleSelectionMode,
    selectedTweetIds,
    selectAllTweets,
    setShowTranslationButton,
  } = useTranslationStore()

  const { handleScreenshot, isCapturing } = useScreenshotAction({ tweets })

  // 1. 渲染选择模式
  if (isSelectionMode) {
    // 修正计算逻辑：总数 = 评论数 + 主推文(如果有)
    const totalCount = tweets.length + (mainTweet ? 1 : 0)
    const isAllSelected = totalCount > 0 && selectedTweetIds.length === totalCount

    return (
      <SelectionModeActions
        disabled={isCapturing}
        isAllSelected={isAllSelected}
        count={selectedTweetIds.length}
        onToggleSelectAll={() => selectAllTweets(!isAllSelected)}
        onCancel={() => toggleSelectionMode(false)}
        onConfirm={() => handleScreenshot(true)}
      />
    )
  }

  // 2. 渲染多推文模式 (如果有评论)
  if (commentsCount > 0) {
    return (
      <DropdownActions
        disabled={isCapturing}
        buttonProps={props}
        onFullScreenshot={() => handleScreenshot(false)}
        onManualSelect={() => {
          toggleSelectionMode(true)
          setShowTranslationButton(false)
        }}
      />
    )
  }

  // 3. 渲染单推文/默认模式 (只有主推文或没有任何数据)
  return (
    <Button
      {...props}
      disabled={isCapturing}
      onClick={() => handleScreenshot(false)}
    >
      {isCapturing ? '处理中...' : (props.children ?? '截图')}
    </Button>
  )
}
