import type { IGPost } from '~/types'
import { Separator } from '~/components/ui/separator'
import { cn } from '~/lib/utils'
import { IGActionBar } from './IGActionBar'
import { IGCaption } from './IGCaption'
import { IGCardHeader } from './IGCardHeader'
import { IGMediaGrid } from './IGMediaGrid'

interface InstagramPostCardProps {
  post: IGPost
  className?: string
}

/**
 * Instagram 透卡相框 — 完整苹果风格卡片。
 *
 * 组合架构：
 * ```
 * IGCardHeader  (头像 + 蓝勾 + 三点)
 * IGMediaGrid   (九宫格，aspect-square，+N 折叠)
 * IGActionBar   (Heart/Comment/Share/Bookmark)
 * ── separator
 * IGCaption     (原文 100% 展开 + 译文灰化)
 * "Liked by others" / "View all comments" (模糊互动层)
 * ```
 *
 * 所有子组件均可独立复用。
 * 遵循 Apple HIG：16px 基准间距、无 line-clamp、层级分离。
 */
export function InstagramPostCard({ post, className }: InstagramPostCardProps) {
  const timestamp = post.created_at
    ? new Date(post.created_at).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : undefined

  return (
    <article
      className={cn(
        'w-full max-w-[468px] mx-auto',
        'bg-card rounded-2xl',
        'border border-border/30',
        'shadow-sm shadow-black/[0.02] dark:shadow-white/[0.02]',
        'overflow-hidden',
        className,
      )}
    >
      {/* === Header === */}
      <div className="px-4 pt-3 pb-2">
        <IGCardHeader
          username={post.username}
          fullname={post.fullname}
          avatarUrl={post.avatar_url}
          verified={post.verified}
          timestamp={timestamp}
          locationName={post.location_name}
        />
      </div>

      {/* === Media Grid === */}
      {post.media?.length > 0 && <IGMediaGrid media={post.media} />}

      {/* === Action Bar === */}
      <IGActionBar />

      {/* === Caption === */}
      {post.description && (
        <>
          <IGCaption
            username={post.username}
            text={post.description}
            translatedText={post.captionTranslation}
            tags={post.tags}
          />

          {/* 模糊互动层 */}
          <div className="px-4 pb-3 space-y-1">
            <p className="text-xs text-muted-foreground/60">
              Liked by others
            </p>
            <button className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              View all comments
            </button>
          </div>
        </>
      )}

      {!post.description && <Separator className="mx-4" />}
    </article>
  )
}
