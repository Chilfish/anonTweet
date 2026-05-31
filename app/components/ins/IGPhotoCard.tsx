import type { IGPost } from '~/types'
import { Card, CardContent } from '~/components/ui/card'
import { cn } from '~/lib/utils'
import { IGCaption } from './IGCaption'
import { IGCardHeader } from './IGCardHeader'
import { IGMediaGrid } from './IGMediaGrid'

interface IGPhotoCardProps {
  post: IGPost
  /** 媒体折叠阈值（默认 6） */
  maxVisible?: number
  className?: string
}

/**
 * Instagram 透卡相框 — 整体卡片组合。
 *
 * 设计理念：
 * - 复用 {@link Card} 作基底，inner shadow 模拟实体相框
 * - 头像行 + 宫格媒体 + caption 三段式布局
 * - 互动数据（likes）降级为非主要信息
 */
export function IGPhotoCard({ post, maxVisible = 6, className }: IGPhotoCardProps) {
  return (
    <Card
      className={cn(
        // 透卡相框感：更紧凑的内边距、柔和的内部阴影
        'w-full max-w-lg mx-auto',
        'gap-0 p-0 overflow-hidden',
        'shadow-md shadow-black/5 dark:shadow-white/5',
        'border-border/40',
        className,
      )}
    >
      {/* 头像 & 元信息 */}
      <div className="px-4 pt-4 pb-3">
        <IGCardHeader post={post} />
      </div>

      {/* 媒体宫格（相框核心区） */}
      {post.media?.length > 0 && (
        <div className="px-1">
          <IGMediaGrid
            media={post.media}
            maxVisible={maxVisible}
            className="rounded-lg"
          />
        </div>
      )}

      {/* Caption */}
      {post.description && (
        <CardContent className="px-4 pt-3 pb-4">
          <IGCaption
            username={post.username}
            text={post.description}
            tags={post.tags}
          />
        </CardContent>
      )}

      {/* 底部元信息（无 caption 时也显示） */}
      {!post.description && (
        <div className="px-4 pb-4" />
      )}
    </Card>
  )
}
