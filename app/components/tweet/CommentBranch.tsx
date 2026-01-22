import type { EnrichedTweet } from '~/types'
import { forwardRef, memo, useRef } from 'react'
import { useElementSize } from '~/hooks/use-element-size'
import { useIsCapturingSelected, useIsTweetSelected } from '~/lib/stores/hooks'
import { SelectableTweetWrapper } from './SelectableTweetWrapper'
import { ThreadLine } from './ThreadLine'
import { TweetNode } from './TweetNode'

interface CommentBranchProps {
  tweet: EnrichedTweet
  isTopLevel?: boolean
}

// 头像中心相对于TweetNode顶部的偏移量
const AVATAR_CENTER_Y_OFFSET = 24
const EMPTY_REPLIES: EnrichedTweet[] = []

const BranchThreadLine = memo(({
  lastChildRef,
}: {
  lastChildRef: React.RefObject<HTMLDivElement | null>
}) => {
  const { height: lastChildHeight } = useElementSize(lastChildRef)

  // topOffset: 让线条从第一个头像中心开始
  // ThreadLine内部会 +16px，所以这里要减去16
  const topOffset = AVATAR_CENTER_Y_OFFSET - 16

  // bottomOffset: 让线条在最后一个头像中心结束
  // 计算最后一个元素头像中心距离容器底部的实际距离
  const bottomOffset = lastChildHeight > 0
    ? Math.max(0, lastChildHeight - AVATAR_CENTER_Y_OFFSET)
    : 0

  return (
    <ThreadLine
      topOffset={topOffset}
      bottomOffset={bottomOffset}
    />
  )
})

BranchThreadLine.displayName = 'BranchThreadLine'

const CommentBranchComponent = forwardRef<HTMLDivElement, CommentBranchProps>(({
  tweet,
  isTopLevel = true,
}, ref) => {
  const replies = tweet.comments || EMPTY_REPLIES
  const hasReplies = replies.length > 0
  const isCapturingSelected = useIsCapturingSelected()
  const isSelected = useIsTweetSelected(tweet.id_str)

  // 用于获取最后一个子元素的ref
  const lastChildRef = useRef<HTMLDivElement>(null)

  if (isCapturingSelected && !isSelected) {
    return null
  }

  return (
    <div
      className="border-b border-[#cfd9de]/30 py-2 last:border-b-0 last:pb-0 dark:border-[#333639]/30 relative"
      ref={ref}
    >
      {hasReplies && (
        <BranchThreadLine lastChildRef={lastChildRef} />
      )}

      <SelectableTweetWrapper
        tweetId={tweet.id_str}
        show={isTopLevel}
      >
        <TweetNode
          tweet={tweet}
          variant={hasReplies ? 'thread' : 'main-in-thread'}
          hasParent={hasReplies}
        />
      </SelectableTweetWrapper>

      {hasReplies && (
        <div>
          {replies.map((reply, index) => (
            <CommentBranch
              key={reply.id_str}
              tweet={reply}
              isTopLevel={false}
              ref={index === replies.length - 1 ? lastChildRef : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
})

CommentBranchComponent.displayName = 'CommentBranch'

export const CommentBranch = memo(CommentBranchComponent)
