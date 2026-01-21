import type { EnrichedTweet } from '~/types'
import { createRef, useMemo, useRef } from 'react'
import { useElementSize } from '~/hooks/use-element-size'
import { useUIState } from '~/lib/stores/hooks'
import { SelectableTweetWrapper } from './SelectableTweetWrapper'
import { ThreadLine } from './ThreadLine'
import { TweetNode } from './TweetNode'

interface CommentBranchProps {
  tweet: EnrichedTweet
  ref?: React.RefObject<HTMLDivElement | null>
}

// 常量：头像中心相对于 TweetNode 顶部的距离
// 基于 py-2 (8px) + 头像中心偏移 (约12-16px) 的估算值，24px 是一个较为通用的对齐点
const AVATAR_CENTER_Y_OFFSET = 24

export function CommentBranch({ tweet, ref }: CommentBranchProps) {
  const replies = tweet.comments || []
  const hasReplies = replies.length > 0
  const {
    selectedTweetIds,
    isCapturingSelected,
  } = useUIState()

  const isSelected = selectedTweetIds.includes(tweet.id_str)

  const nodeRef = useRef<HTMLDivElement>(null)

  // 当 isCapturingSelected 变化时（例如从隐藏状态恢复显示），
  // 我们强制生成一个新的 ref 对象。这会触发 useElementSize 内部的 Effect 重新执行，
  // 确保能正确 hook 到重新创建的 DOM 节点上进行测量。
  // 如果仅使用 useRef，ref 对象引用不变，子组件重新挂载时测量逻辑不会被激活。
  const lastChildRef = useMemo(
    () => createRef<HTMLDivElement>(),
    [isCapturingSelected],
  )

  const { height: lastChildHeight } = useElementSize(lastChildRef)

  if (isCapturingSelected && !isSelected) {
    return null
  }

  // 1. 计算 Top Offset
  // 这里的公式是为了让线条起始点对齐第一个头像的中心
  // ThreadLine 内部 top = offset + 16，所以 offset = Target - 16
  const lineTopOffset = AVATAR_CENTER_Y_OFFSET - 16

  // 2. 计算 Bottom Offset
  // 目标：线条底部 = 最后一个子元素的高度 - 该子元素头像中心的位置
  // ThreadLine css bottom = 100% - bottomOffset (简化理解)
  // 如果 lastChildHeight 为 0 (未测量到)，偏移量为 0，线条会画到底部 (符合预期或稍有瑕疵但不会报错)
  const lineBottomOffset = Math.max(0, lastChildHeight - AVATAR_CENTER_Y_OFFSET)

  return (
    <div
      className="border-b border-[#cfd9de]/30 py-2 last:border-b-0 last:pb-0 dark:border-[#333639]/30 relative"
      ref={ref}
    >
      {hasReplies && (
        <ThreadLine
          topOffset={lineTopOffset}
          bottomOffset={lineBottomOffset}
        />
      )}

      <SelectableTweetWrapper
        tweetId={tweet.id_str}
      >
        <TweetNode
          ref={nodeRef}
          tweet={tweet}
          variant={hasReplies ? 'thread' : 'main-in-thread'}
          hasParent={hasReplies}
        />
      </SelectableTweetWrapper>

      {hasReplies && replies.map((reply, index) => (
        <CommentBranch
          key={reply.id_str}
          tweet={reply}
          ref={index === replies.length - 1 ? lastChildRef : useRef(null)}
        />
      ))}
    </div>
  )
}
