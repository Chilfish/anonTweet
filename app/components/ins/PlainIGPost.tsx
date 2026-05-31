import type { IGPost } from '~/types'
import { Separator } from '~/components/ui/separator'
import { cn } from '~/lib/utils'
import { IGActionBar } from './IGActionBar'
import { IGCaption } from './IGCaption'
import { IGCardHeader } from './IGCardHeader'
import { IGMediaGrid } from './IGMediaGrid'

interface PlainIGPostProps {
  post: IGPost
  className?: string
}

/**
 * 纯净版 IG 帖子 — 无外层 chrome，截图专用。
 *
 * 与 {@link InstagramPostCard} 共享相同的子组件，
 * 仅去掉 Card 包装和模糊互动层，专用于 SSR 截图导出。
 */
export function PlainIGPost({ post, className }: PlainIGPostProps) {
  const timestamp = post.created_at
    ? new Date(post.created_at).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : undefined

  return (
    <div className={cn('w-full max-w-[468px] bg-background font-sans antialiased', className)}>
      {/* Header */}
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

      {/* Media */}
      {post.media?.length > 0 && <IGMediaGrid media={post.media} />}

      {/* Actions */}
      <IGActionBar />

      {/* Caption — 截图时可能不需要互动假数据 */}
      {post.description && (
        <>
          <IGCaption
            username={post.username}
            text={post.description}
            translatedText={post.captionTranslation}
            tags={post.tags}
          />
          <div className="px-4 pb-3">
            <p className="text-xs text-muted-foreground/60">Liked by others</p>
          </div>
        </>
      )}

      {!post.description && <Separator className="mx-4" />}
    </div>
  )
}
