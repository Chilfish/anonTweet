import { Bookmark, Heart, MessageCircle, Send } from 'lucide-react'
import { cn } from '~/lib/utils'

interface IGActionBarProps {
  className?: string
}

/**
 * Instagram 互动栏。
 *
 * Apple HIG：四个 outline 图标，flex between 布局。
 * 遵循 "Blurred Interaction" 原则 — 不暴露真实点赞数、评论者。
 */
export function IGActionBar({ className }: IGActionBarProps) {
  return (
    <div className={cn('flex items-center justify-between px-4 py-2', className)}>
      {/* 左侧：Like + Comment + Share */}
      <div className="flex items-center gap-4">
        <button className="size-8 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors" aria-label="点赞">
          <Heart className="size-6" />
        </button>
        <button className="size-8 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors" aria-label="评论">
          <MessageCircle className="size-6" />
        </button>
        <button className="size-8 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors" aria-label="分享">
          <Send className="size-5" />
        </button>
      </div>

      {/* 右侧：Bookmark */}
      <button className="size-8 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors" aria-label="收藏">
        <Bookmark className="size-6" />
      </button>
    </div>
  )
}
