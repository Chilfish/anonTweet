import type { IGPost } from '~/types'
import { cn } from '~/lib/utils'
import { IGActionBar } from './IGActionBar'
import { IGCaption } from './IGCaption'
import { IGCardHeader } from './IGCardHeader'
import { IGMediaGrid } from './IGMediaGrid'
import InsLogo from './InsLogo'

interface InstagramPostCardProps {
  post: IGPost
  className?: string
}

/**
 * Instagram 透卡相框 — 带 InsLogo 的完整卡片。
 *
 * ```
 * InsLogo
 * ─────────────────
 * IGCardHeader  (avatar + fullname + 时间 + ...)
 * IGMediaGrid   (九宫格 + 圆点指示器)
 * IGActionBar   (♥ red / 💬 / ✈ / 🔖)
 * IGCaption     (username bold inline + 原文 + 译文)
 * ```
 */
export function InstagramPostCard({ post, className }: InstagramPostCardProps) {
  return (
    <article
      className={cn(
        'w-full max-w-[468px] mx-auto',
        'bg-card',
        'rounded-sm',
        'border border-border/20',
        'pb-3',
        className,
      )}
    >
      {/* Instagram 艺术字 Logo */}
      <div className="flex items-center justify-center px-4 py-2.5 border-b border-border/15">
        <InsLogo className="h-7 w-auto" />
      </div>

      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <IGCardHeader
          username={post.username}
          fullname={post.fullname}
          avatarUrl={post.avatar_url}
          verified={post.verified}
          createdAt={post.created_at}
        />
      </div>

      {/* Media */}
      {post.media?.length > 0 && <IGMediaGrid media={post.media} />}

      {/* Action Bar */}
      <IGActionBar className="pt-1.5 pb-1" />

      {/* Caption — username inline */}
      {post.description && (
        <IGCaption
          username={post.username}
          text={post.description}
          translatedText={post.captionTranslation}
          tags={post.tags}
          className="px-4 pt-0 pb-0"
        />
      )}
    </article>
  )
}
