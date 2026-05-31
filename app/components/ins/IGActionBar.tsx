import { Bookmark, Heart, MessageCircle, Send } from 'lucide-react'
import { cn } from '~/lib/utils'

interface IGActionBarProps {
  className?: string
}

/**
 * Instagram 互动栏。
 *
 * 四个图标统一 size-6（24px），flex items-center 基线对齐。
 * Like 默认红心填充。
 */
export function IGActionBar({ className }: IGActionBarProps) {
  return (
    <div className={cn('flex items-center justify-between px-4 py-2', className)}>
      <div className="flex items-center gap-4">
        <button aria-label="点赞" className="p-1 -m-1">
          <Heart className="size-6 text-[#FF3040] fill-[#FF3040]" />
        </button>
        <button aria-label="评论" className="p-1 -m-1">
          <MessageCircle className="size-6 text-foreground" />
        </button>
        <button aria-label="分享" className="p-1 -m-1">
          <Send className="size-[1.15rem] text-foreground" />
        </button>
      </div>

      <button aria-label="收藏" className="p-1 -m-1">
        <Bookmark className="size-6 text-foreground" />
      </button>
    </div>
  )
}
