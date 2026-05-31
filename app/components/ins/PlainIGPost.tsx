import type { IGPost } from '~/types'
import { cn } from '~/lib/utils'
import { IGActionBar } from './IGActionBar'
import { IGCaption } from './IGCaption'
import { IGCardHeader } from './IGCardHeader'
import { IGMediaGrid } from './IGMediaGrid'
import { IGMusicInfo } from './IGMusicInfo'

function formatTime(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${day} ${h}:${mi}`
}

interface PlainIGPostProps {
  post: IGPost
  className?: string
}

/**
 * 纯净版 — 截图导出专用，与 InstagramPostCard 结构一致。
 */
export function PlainIGPost({ post, className }: PlainIGPostProps) {
  return (
    <div className={cn('w-full max-w-[468px] bg-background font-sans antialiased', className)}>
      <div className="px-4 pt-3 pb-2">
        <IGCardHeader
          username={post.username}
          fullname={post.fullname}
          avatarUrl={post.avatar_url}
          verified={post.verified}
        />
      </div>

      {post.media?.length > 0 && <IGMediaGrid media={post.media} />}

      {post.audio && <IGMusicInfo audio={post.audio} />}

      <IGActionBar className="pt-1.5 pb-1" />

      {post.created_at && (
        <p className="px-4 text-xs text-muted-foreground/50 tabular-nums pb-1">
          {formatTime(post.created_at)}
        </p>
      )}

      {post.description && (
        <IGCaption
          username={post.username}
          text={post.description}
          translatedText={post.captionTranslation}
          tags={post.tags}
          className="px-4 pt-0 pb-0"
        />
      )}
    </div>
  )
}
