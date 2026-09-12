import type { IGTranslationMode } from './IGTranslateToggle'
import type { IGPost } from '~/types'
import { cn } from '~/lib/utils'
import { InstagramPostCard } from './InstagramPostCard'

interface IGPostListProps {
  posts: IGPost[]
  translationMode?: IGTranslationMode
  /** 单卡翻译完成回调（带上该卡 post.id，便于按卡回写 SWR 缓存）。 */
  onTranslated?: (postId: string, captionTranslation: string) => void
  className?: string
}

/**
 * IG 帖子列表。
 *
 * 快拍 / 精选集走下载优先的 `IGStoryList`；此组件用于普通 post / reel
 * （每个请求恒为单卡），沿用页面 `IGHeader` 的整套操作。
 */
export function IGPostList({
  posts,
  translationMode = 'bilingual',
  onTranslated,
  className,
}: IGPostListProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {posts.map(post => (
        <InstagramPostCard
          key={post.id}
          post={post}
          translationMode={translationMode}
          onTranslated={onTranslated
            ? captionTranslation => onTranslated(post.id, captionTranslation)
            : undefined}
        />
      ))}
    </div>
  )
}
