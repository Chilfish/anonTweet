import type { IGPost } from '~/types'
import { cn } from '~/lib/utils'
import { IGCaption } from './IGCaption'
import { IGCardHeader } from './IGCardHeader'
import { IGMediaGrid } from './IGMediaGrid'

interface PlainIGPostProps {
  post: IGPost
  className?: string
}

/**
 * 纯净版 IG 帖子 — 无 Layout/chrome，复用抽象子组件。
 *
 * 与 {@link IGPhotoCard} 共享相同的 IGCardHeader / IGMediaGrid / IGCaption，
 * 仅去掉外层 Card 包装，专用于服务端截图导出。
 */
export function PlainIGPost({ post, className }: PlainIGPostProps) {
  return (
    <div className={cn('w-full max-w-lg bg-background font-sans antialiased', className)}>
      {/* 头像 & 元信息 */}
      <div className="px-4 pt-4 pb-3">
        <IGCardHeader post={post} />
      </div>

      {/* 媒体宫格 */}
      {post.media?.length > 0 && (
        <div className="px-1">
          <IGMediaGrid
            media={post.media}
            maxVisible={12}
            className="rounded-lg"
          />
        </div>
      )}

      {/* Caption */}
      {post.description && (
        <div className="px-4 pt-3 pb-4">
          <IGCaption
            username={post.username}
            text={post.description}
            tags={post.tags}
          />
        </div>
      )}
    </div>
  )
}
