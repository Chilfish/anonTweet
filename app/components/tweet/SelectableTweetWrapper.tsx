import type { ReactNode } from 'react'
import { Checkbox } from '~/components/ui/checkbox'
import { useTranslationStore } from '~/lib/stores/translation'
import { cn } from '~/lib/utils'

interface SelectableTweetWrapperProps {
  tweetId: string
  children: ReactNode
  className?: string
  ignoreCaptureFilter?: boolean // 主推文可能无论如何都要显示
}

export function SelectableTweetWrapper({ tweetId, children, className, ignoreCaptureFilter }: SelectableTweetWrapperProps) {
  const { isSelectionMode, selectedTweetIds, toggleTweetSelection, isCapturingSelected } = useTranslationStore()

  const isSelected = selectedTweetIds.includes(tweetId)

  // 核心业务：如果是截图模式且未被选中，则隐藏（除非强制忽略过滤）
  if (isCapturingSelected && !isSelected && !ignoreCaptureFilter) {
    return null
  }

  return (
    <div
      data-tweet-id={tweetId}
      data-selected={isSelected}
      className={cn('relative transition-all duration-300', className)}
    >
      {isSelectionMode && (
        <Checkbox
          data-ignore-screenshot="true"
          className="absolute right-4 top-4 z-10"
          checked={isSelected}
          onCheckedChange={() => toggleTweetSelection(tweetId)}
          onClick={e => e.stopPropagation()}
        />
      )}
      {children}
    </div>
  )
}
