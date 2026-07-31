import { Bookmark, Heart, MessageCircle, Send } from 'lucide-react'
import { cn } from '~/lib/utils'

interface IGActionBarProps {
  className?: string
  /** Instagram 原帖链接，传入后分享按钮变为链接 */
  postUrl?: string
}

/**
 * Instagram 互动栏。
 *
 * 四个图标统一 size-6，基线对齐。
 * ❤️ 红心填充，🔖 蓝色收藏填充。
 * ✈ 分享按钮：有 postUrl 时为链接，否则为静态按钮（骨架屏）。
 */
export function IGActionBar({ className, postUrl }: IGActionBarProps) {
  const ShareIcon = (
    <Send className="size-6" />
  )

  return (
    <div className={cn('flex items-center justify-between px-4 my-2', className)}>
      <div className="flex items-center gap-4">
        <button aria-label="点赞" className="p-1 -m-1">
          <Heart className="size-6 text-[#FF3040] fill-[#FF3040]" />
        </button>
        <button aria-label="评论" className="p-1 -m-1">
          <MessageCircle className="size-6" />
        </button>
        {postUrl
          ? (
              <a
                aria-label="分享"
                className="p-1 -m-1 inline-flex"
                href={postUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {ShareIcon}
              </a>
            )
          : (
              <button aria-label="分享" className="p-1 -m-1">
                {ShareIcon}
              </button>
            )}
      </div>

      <button aria-label="收藏" className="p-1 -m-1">
        <Bookmark className="size-6 text-[#262626] fill-[#262626] dark:text-[#f5f5f5] dark:fill-[#f5f5f5]" />
      </button>
    </div>
  )
}
