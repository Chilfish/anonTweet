import type { IGPost } from '~/types'
import { Heart, MapPin } from 'lucide-react'
import { cn } from '~/lib/utils'
import { IGMediaCarousel } from './IGMediaCarousel'

interface IGPostCardProps {
  post: IGPost
  className?: string
}

/**
 * Instagram 帖子卡片 — 核心渲染组件。
 *
 * 布局：头像行 → 多图轮播 → caption → 互动数据
 */
export function IGPostCard({ post, className }: IGPostCardProps) {
  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      {/* 头像 & 用户行 */}
      <div className="flex items-center gap-3 px-4 py-3">
        {post.avatar_url && (
          <img
            src={post.avatar_url}
            alt={post.username}
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{post.username}</p>
          {post.fullname && post.fullname !== post.username && (
            <p className="text-xs text-muted-foreground truncate">{post.fullname}</p>
          )}
          {post.location_name && (
            <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
              <MapPin className="w-3 h-3" />
              {post.location_name}
            </p>
          )}
        </div>
      </div>

      {/* 媒体轮播 */}
      {post.media?.length > 0 && (
        <IGMediaCarousel media={post.media} />
      )}

      {/* 互动行 */}
      <div className="flex items-center gap-4 px-4 py-2">
        <span className="text-sm font-semibold flex items-center gap-1">
          <Heart className="w-4 h-4" />
          {post.likes.toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground">{post.type}</span>
      </div>

      {/* Caption */}
      {post.description && (
        <div className="px-4 pb-3">
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
