import type { ComponentProps } from 'react'
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
    <div className="flex gap-2">
      <Button variant="outline" onClick={onToggleSelectAll} disabled={disabled}>
        {isAllSelected ? '全不选' : '全选'}
      </Button>
      <Button variant="secondary" onClick={onCancel} disabled={disabled}>
        取消
      </Button>
      <Button onClick={onConfirm} disabled={disabled}>
        确认 (
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={(
        <Button {...buttonProps} disabled={disabled} />
      )}
      >
        截图
        {' '}
        <span className="ml-1 text-xs">▼</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onFullScreenshot}>
          全屏截图
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onManualSelect}>
          手动选择...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SaveAsImageButton(props: ComponentProps<typeof Button>) {
  const {
    tweets,
    isSelectionMode,
    toggleSelectionMode,
    selectedTweetIds,
    selectAllTweets,
    setShowTranslationButton,
  } = useTranslationStore()

  // 所有的脏逻辑都在这里面
  const { handleScreenshot, isCapturing } = useScreenshotAction({ tweets })

  // 1. 渲染选择模式 (Priority 1)
  if (isSelectionMode) {
    const isAllSelected = tweets.length > 0 && selectedTweetIds.length === tweets.length

    return (
      <SelectionModeActions
        disabled={isCapturing}
        isAllSelected={isAllSelected}
        count={selectedTweetIds.length}
        onToggleSelectAll={() => selectAllTweets(!isAllSelected)}
        onCancel={() => toggleSelectionMode(false)}
        onConfirm={() => handleScreenshot(true)} // true = use selection
      />
    )
  }

  // 2. 渲染多推文模式 (Priority 2)
  if (tweets.length > 1) {
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

  // 3. 渲染单推文/默认模式 (Fallback)
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
