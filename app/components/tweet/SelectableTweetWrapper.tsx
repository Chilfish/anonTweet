import type { ReactNode } from 'react'
import { memo, useCallback } from 'react'
import { Checkbox } from '~/components/ui/checkbox'
import {
  useIsCapturingSelected,
  useIsSelectionMode,
  useIsTweetSelected,
  useTranslationUIActions,
} from '~/lib/stores/hooks'
import { cn } from '~/lib/utils'

interface SelectableTweetWrapperProps {
  tweetId: string
  children: ReactNode
  className?: string
}

function SelectableTweetWrapperComponent({
  tweetId,
  children,
  className,
}: SelectableTweetWrapperProps) {
  const isSelectionMode = useIsSelectionMode()
  const isCapturingSelected = useIsCapturingSelected()
  const isSelected = useIsTweetSelected(tweetId)
  const { toggleTweetSelection } = useTranslationUIActions()

  const handleToggle = useCallback(() => {
    toggleTweetSelection(tweetId)
  }, [toggleTweetSelection, tweetId])

  const handleClick = useCallback((e: React.MouseEvent) => {
    // 允许点击整个区域来选中，体验更好
    if (isSelectionMode) {
      e.stopPropagation()
      e.preventDefault()
      toggleTweetSelection(tweetId)
    }
  }, [isSelectionMode, toggleTweetSelection, tweetId])

  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  // 核心业务：如果是截图模式且未被选中，则隐藏
  if (isCapturingSelected && !isSelected) {
    return null
  }

  return (
    <div
      data-tweet-id={tweetId}
      data-selected={isSelected}
      className={cn(
        'relative transition-all duration-300 ease-in-out',
        className,
      )}
      onClick={handleClick}
    >
      {isSelectionMode && (
        <div className="absolute top-4 right-4 z-20 flex items-center justify-center">
          <Checkbox
            data-ignore-screenshot="true"
            className="size-4 border-2 border-primary"
            checked={isSelected}
            // onCheckedChange 已经通过外层 div 的 onClick 处理了，这里只需展示状态，
            // 或者保留 onCheckedChange 以支持精确点击
            onCheckedChange={handleToggle}
            onClick={handleCheckboxClick}
          />
        </div>
      )}
      {children}
    </div>
  )
}

export const SelectableTweetWrapper = memo(SelectableTweetWrapperComponent)
