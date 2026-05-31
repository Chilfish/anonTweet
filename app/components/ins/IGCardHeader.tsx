import type { IGPost } from '~/types'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { cn } from '~/lib/utils'

interface IGCardHeaderProps {
  post: IGPost
  className?: string
}

/**
 * Instagram 卡片头部 — 头像 + 用户名 + 显示名 + 发布时间。
 *
 * 复用 {@link Avatar}、遵循 Native-First 排版层级：
 * 用户名 font-semibold → 显示名 font-normal text-muted → 时间 right-aligned。
 */
export function IGCardHeader({ post, className }: IGCardHeaderProps) {
  const timeText = post.created_at
    ? new Date(post.created_at).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div className={cn('flex items-start gap-3', className)}>
      {/* 头像 — 复用 Base UI Avatar */}
      <Avatar className="size-10 shrink-0">
        {post.avatar_url
          ? <AvatarImage src={post.avatar_url} alt={post.username} />
          : <AvatarFallback>{post.username[0]?.toUpperCase() ?? '?'}</AvatarFallback>}
      </Avatar>

      {/* 元信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm truncate">
            {post.username}
          </span>
          {post.fullname && post.fullname !== post.username && (
            <span className="text-xs text-muted-foreground truncate">
              {post.fullname}
            </span>
          )}
        </div>

        {post.location_name && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {post.location_name}
          </p>
        )}
      </div>

      {/* 发布时间 */}
      {timeText && (
        <span className="text-xs text-muted-foreground/60 shrink-0 mt-0.5">
          {timeText}
        </span>
      )}
    </div>
  )
}
