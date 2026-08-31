import { ExternalLinkIcon } from 'lucide-react'
import { Link } from 'react-router'

interface OpenDetailLinkProps {
  tweetId: string
}

/**
 * 列表/搜索结果的「查看完整翻译」入口：卡片底部右对齐的小链接，
 * 跳转到正式翻译页 `/tweets/:id`（加载完整翻译 + 评论区）。
 *
 * 刻意不放在 MyTweet / TweetNode 内部：这些组件被 plain（截图）路由复用，
 * 截图场景不能有跳转入口（截图隔离规范）。使用真实 `<Link>`，
 * 保证键盘可达与中键新标签。
 */
export function OpenDetailLink({ tweetId }: OpenDetailLinkProps) {
  return (
    <div className="flex justify-end pr-1 pt-1">
      <Link
        to={`/tweets/${tweetId}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        查看完整翻译
        <ExternalLinkIcon className="size-3" />
      </Link>
    </div>
  )
}
