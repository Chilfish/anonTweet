import type { IGPost } from '~/types'
import { cn } from '~/lib/utils'
import { IGActionBar } from './IGActionBar'
import { IGCaption } from './IGCaption'
import { IGCardHeader } from './IGCardHeader'
import { IGMediaGrid } from './IGMediaGrid'
import InsLogo from './InsLogo'

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
      {/* Logo */}
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

      {/* Actions */}
      <IGActionBar className="pt-1.5 pb-1" />

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
    </div>
  )
}
