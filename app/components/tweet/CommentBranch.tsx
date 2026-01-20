import type { EnrichedTweet } from '~/types'
import { useLayoutEffect, useRef, useState } from 'react' // 引入 useLayoutEffect, useState
import { useElementSize } from '~/hooks/use-element-size'
import { useTranslationStore } from '~/lib/stores/translation'
import { SelectableTweetWrapper } from './SelectableTweetWrapper'
import { ThreadLine } from './ThreadLine'
import { TweetNode } from './TweetNode'

interface CommentBranchProps {
  tweet: EnrichedTweet
}

// 常量：头像中心相对于 TweetNode 顶部的距离
// 根据你的 CSS (py-2 等) 和头像大小估算。
// 假设 padding-top 是 0.5rem(8px)，头像 small 是 24px，那么中心大约在 8 + 12 = 20px 处
// 如果是 py-2 (8px) + 32px 头像，中心在 24px。请根据实际调整此值。
const AVATAR_CENTER_Y_OFFSET = 24

export function CommentBranch({ tweet }: CommentBranchProps) {
  const replies = tweet.comments || []
  const hasReplies = replies.length > 0
  const {
    selectedTweetIds,
    isCapturingSelected,
  } = useTranslationStore()

  const isSelected = selectedTweetIds.includes(tweet.id_str)

  const nodeRef = useRef<HTMLDivElement>(null)
  const childrenRef = useRef<HTMLDivElement>(null)

  // 新增：专门存储最后一个子元素的高度
  const [lastChildHeight, setLastChildHeight] = useState(0)

  // 测量高度
  const { height: nodeHeight } = useElementSize(nodeRef)
  const { height: childrenHeight } = useElementSize(childrenRef)

  // 核心修复逻辑：监听并测量最后一个子元素
  useLayoutEffect(() => {
    if (!childrenRef.current || !hasReplies)
      return

    const measureLastChild = () => {
      const container = childrenRef.current
      if (!container)
        return

      const lastChild = container.lastElementChild as HTMLElement
      if (lastChild) {
        // 获取包括 margin 的完整高度，或者 clientHeight
        // 如果你的子元素有 margin-bottom，可能需要 getComputedStyle
        setLastChildHeight(lastChild.getBoundingClientRect().height)
      }
    }

    // 初始测量
    measureLastChild()

    // 既然使用了 ResizeObserver 监听容器，当容器变化时通常意味着子元素变化
    // 这里为了稳健，可以复用 ResizeObserver 逻辑，或者简单依赖 childrenHeight 变化触发
    const observer = new ResizeObserver(measureLastChild)
    observer.observe(childrenRef.current)

    return () => observer.disconnect()
  }, [hasReplies, childrenHeight]) // 依赖 childrenHeight 变化自动重算

  if (isCapturingSelected && !isSelected) {
    return null
  }

  // 计算底部偏移量
  // 逻辑：线条应该占据整个 children 区域，但要切掉 (最后一个子元素高度 - 头像偏移)
  // 比如：最后一条推特高 100px，头像在 24px。线条应该在底部缩短 (100 - 24) = 76px
  const bottomCorrection = Math.max(0, lastChildHeight - AVATAR_CENTER_Y_OFFSET)

  return (
    <div className="border-b border-[#cfd9de]/30 py-2 last:border-b-0 dark:border-[#333639]/30 relative">
      <SelectableTweetWrapper
        tweetId={tweet.id_str}
      >
        {/* 连接线 */}
        {hasReplies && (
          <ThreadLine
            // 这里的 topOffset 是为了避开父节点的高度
            topOffset={nodeHeight}
            // 这里的 bottomOffset 是核心修改：
            // 我们不传 childrenHeight，而是传“需要减去的底部空白区域”
            bottomOffset={bottomCorrection}
          />
        )}

        <TweetNode
          ref={nodeRef}
          tweet={tweet}
          variant={hasReplies ? 'thread' : 'main-in-thread'}
          hasParent={hasReplies}
          avatarSize="small"
        />
      </SelectableTweetWrapper>

      <div ref={childrenRef}>
        {hasReplies && replies.map(reply => (
          <CommentBranch key={reply.id_str} tweet={reply} />
        ))}
      </div>
    </div>
  )
}
