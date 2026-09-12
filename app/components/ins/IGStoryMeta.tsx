import type { IGPost } from '~/types'
import { Link2 } from 'lucide-react'
import { cn } from '~/lib/utils'

interface IGStoryMetaProps {
  post: IGPost
  className?: string
}

/** Story 类帖子（story / highlight）——无帖子互动区（点赞/评论/收藏） */
export function isStoryPost(post: IGPost): boolean {
  return post.type === 'story' || post.type === 'highlight'
}

/**
 * Story 专属元信息行。
 *
 * 仅 story / highlight 渲染：精选集标题、转发来源、链接贴纸（swipe-up CTA）。
 * 普通帖子返回 null（不额外渲染）。
 */
export function IGStoryMeta({ post, className }: IGStoryMetaProps) {
  if (!isStoryPost(post))
    return null

  const { highlight_title, resharedFrom, storyLink } = post
  if (!highlight_title && !resharedFrom && !storyLink)
    return null

  return (
    <div className={cn('flex flex-col gap-1 px-4 py-1.5', className)}>
      {highlight_title && (
        <p className="text-xs font-medium text-foreground/80">
          精选 ·
          {' '}
          {highlight_title}
        </p>
      )}

      {resharedFrom && (
        <p className="text-xs text-muted-foreground/70">
          转自 @
          {resharedFrom.username}
        </p>
      )}

      {storyLink && (
        <a
          href={storyLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 hover:underline"
        >
          <Link2 className="size-3.5 shrink-0" />
          <span className="truncate">
            {storyLink.title || storyLink.display || storyLink.url}
          </span>
        </a>
      )}
    </div>
  )
}
