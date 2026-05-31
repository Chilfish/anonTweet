import type { IGPost } from '~/types'
import { Heart } from 'lucide-react'
import { cn } from '~/lib/utils'
import { IGMediaCarousel } from './IGMediaCarousel'

interface PlainIGPostProps {
  post: IGPost
  className?: string
}

/**
 * 纯净版 IG 帖子渲染 — 无 Layout/Sidebar/chrome，
 * 专用于服务端截图导出。
 */
export function PlainIGPost({ post, className }: PlainIGPostProps) {
  return (
    <div className={cn('w-full max-w-2xl bg-background font-sans antialiased', className)}>
      {/* 头像 & 用户 */}
      <div className="flex items-center gap-3 px-4 py-3">
        {post.avatar_url && (
          <img
            src={post.avatar_url}
            alt={post.username}
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <div>
          <p className="font-semibold text-sm">{post.username}</p>
          {post.fullname && post.fullname !== post.username && (
            <p className="text-xs text-muted-foreground">{post.fullname}</p>
          )}
        </div>
      </div>

      {/* 媒体 */}
      {post.media?.length > 0 && (
        <IGMediaCarousel media={post.media} />
      )}

      {/* 互动 */}
      <div className="flex items-center gap-4 px-4 py-2">
        <span className="text-sm font-semibold flex items-center gap-1">
          <Heart className="w-4 h-4" />
          {post.likes.toLocaleString()}
        </span>
      </div>

      {/* Caption */}
      {post.description && (
        <div className="px-4 pb-4">
          <p className="text-sm whitespace-pre-wrap break-words">
            <span className="font-semibold mr-1">{post.username}</span>
            {post.description}
          </p>
          {post.tags && post.tags.length > 0 && (
            <p className="text-xs text-primary/80 mt-1">
              {post.tags.map(t => `#${t}`).join(' ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
