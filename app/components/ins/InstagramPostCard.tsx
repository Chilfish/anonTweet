import type { IGPost } from '~/types'
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
 * 绝对时间格式化
 */
function formatTime(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${day} ${h}:${mi}`
}

/**
 * Instagram 透卡相框。
 *
 * ```
 * IGCardHeader   (avatar · name · InsLogo · ···)
 * IGMediaGrid    (九宫格，+N 毛玻璃折叠)
 * IGActionBar    (❤️ / 💬 / ✈ / 🔖 filled)
 * timestamp      ← 放在这里，IG 原生节奏
 * IGCaption      (username bold + 原文 + 译文)
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
      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <IGCardHeader
          username={post.username}
          fullname={post.fullname}
          avatarUrl={post.avatar_url}
          verified={post.verified}
        />
      </div>

      {/* Media */}
      {post.media?.length > 0 && <IGMediaGrid media={post.media} />}

      {/* Action Bar */}
      <IGActionBar className="pt-1.5 pb-1" />

      {/* 时间戳 — action 和 caption 之间 */}
      {post.created_at && (
        <p className="px-4 text-xs text-muted-foreground/50 tabular-nums pb-1">
          {formatTime(post.created_at)}
        </p>
      )}

      {/* Caption */}
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
