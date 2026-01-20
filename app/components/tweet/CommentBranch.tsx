import type { EnrichedTweet } from '~/types'
import { useRef } from 'react'
import { useElementSize } from '~/hooks/use-element-size'
import { SelectableTweetWrapper } from './SelectableTweetWrapper'
import { ThreadLine } from './ThreadLine'
import { TweetNode } from './TweetNode'

interface CommentBranchProps {
  tweet: EnrichedTweet
}

export function CommentBranch({ tweet }: CommentBranchProps) {
  const replies = tweet.comments || []
  const hasReplies = replies.length > 0

  const nodeRef = useRef<HTMLDivElement>(null)
  const childrenRef = useRef<HTMLDivElement>(null)

  // 测量高度用于绘制连线
  const { height: nodeHeight } = useElementSize(nodeRef)
  const { height: childrenHeight } = useElementSize(childrenRef)

  return (
    <div className="border-b border-[#cfd9de]/30 py-2 last:border-b-0 dark:border-[#333639]/30 relative">
      <SelectableTweetWrapper tweetId={tweet.id_str}>
        {/* 连接线：连接当前节点和子评论 */}
        {hasReplies && (
          <ThreadLine
            topOffset={nodeHeight}
            bottomOffset={childrenHeight} // 这里的计算逻辑可能需要根据实际DOM微调，原逻辑是减去两者
            // 原逻辑: height: `calc(100% - ${mainTweetHeight}px - ${commentsHeight}px - 1rem)`
            // 如果是在 Wrapper 内部，布局会更清晰
          />
        )}

        <TweetNode
          ref={nodeRef}
          tweet={tweet}
          variant={hasReplies ? 'thread' : 'main-in-thread'}
          hasParent={hasReplies}
        />
      </SelectableTweetWrapper>

      {/* 递归渲染子评论 */}
      <div ref={childrenRef}>
        {hasReplies && replies.map(reply => (
          <CommentBranch key={reply.id_str} tweet={reply} />
        ))}
      </div>
    </div>
  )
}
