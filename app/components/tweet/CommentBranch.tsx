import type { EnrichedTweet } from '~/types'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useElementSize } from '~/hooks/use-element-size'
import { useIsCapturingSelected, useIsTweetSelected } from '~/lib/stores/hooks'
import { SelectableTweetWrapper } from './SelectableTweetWrapper'
import { ThreadLine } from './ThreadLine'
import { TweetNode } from './TweetNode'

interface CommentBranchProps {
  tweet: EnrichedTweet
  ref?: React.RefObject<HTMLDivElement | null>
  isTopLevel?: boolean
}

// 常量：头像中心相对于 TweetNode 顶部的距离
// 基于 py-2 (8px) + 头像中心偏移 (约12-16px) 的估算值，24px 是一个较为通用的对齐点
const AVATAR_CENTER_Y_OFFSET = 24
const EMPTY_REPLIES: EnrichedTweet[] = []

const BranchThreadLine = memo(({ lastChildNode }: { lastChildNode: HTMLElement | null }) => {
  const { height: lastChildHeight } = useElementSize(lastChildNode)

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
    <ThreadLine
      topOffset={lineTopOffset}
      bottomOffset={lineBottomOffset}
    />
  )
})

function CommentBranchComponent({ tweet, ref, isTopLevel = true }: CommentBranchProps) {
  const replies = tweet.comments || EMPTY_REPLIES
  const hasReplies = replies.length > 0
  const isCapturingSelected = useIsCapturingSelected()
  const isSelected = useIsTweetSelected(tweet.id_str)

  const nodeRef = useRef<HTMLDivElement>(null)
  const [lastChildNode, setLastChildNode] = useState<HTMLDivElement | null>(null)

  const lastChildRef = useCallback((node: HTMLDivElement | null) => {
    setLastChildNode(node)
  }, [])

  const tweetContent = useMemo(() => (
    <SelectableTweetWrapper
      tweetId={tweet.id_str}
      show={isTopLevel && !!tweet.comments?.length}
    >
      <TweetNode
        ref={nodeRef}
        tweet={tweet}
        variant={hasReplies ? 'thread' : 'main-in-thread'}
        hasParent={hasReplies}
      />
    </SelectableTweetWrapper>
  ), [tweet, hasReplies, isTopLevel])

  const repliesContent = useMemo(() => replies.map((reply, index) => (
    <CommentBranch
      key={reply.id_str}
      tweet={reply}
      isTopLevel={false}
      ref={index === replies.length - 1 ? lastChildRef : undefined}
    />
  )), [replies, lastChildRef])

  if (isCapturingSelected && !isSelected) {
    return null
  }

  return (
    <div
      className="border-b border-[#cfd9de]/30 py-2 last:border-b-0 last:pb-0 dark:border-[#333639]/30 relative"
      ref={ref}
    >
      {hasReplies && (
        <BranchThreadLine lastChildNode={lastChildNode} />
      )}

      {tweetContent}

      {hasReplies && repliesContent}
    </div>
  )
}

export const CommentBranch = memo(CommentBranchComponent)
