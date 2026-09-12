import type { IGPost } from '~/types'
import { Link2 } from 'lucide-react'
import { cn } from '~/lib/utils'

interface IGStoryMetaProps {
  post: IGPost
  /** 展示环境：card = 卡片（跟随主题）；overlay = 全屏查看器的深色遮罩 */
  tone?: 'card' | 'overlay'
  className?: string
}

/** Story 类帖子（story / highlight）——无帖子互动区（点赞/评论/收藏） */
export function isStoryPost(post: IGPost): boolean {
  return post.type === 'story' || post.type === 'highlight'
}

/**
 * 两种展示环境的配色/内距。
 *
 * overlay 用白系前景：查看器是 `bg-black/95` 遮罩，卡片的 `text-foreground`
 * 在浅色主题下落在黑底上会不可读。
 */
const TONE_STYLES = {
  card: {
    container: 'gap-1 px-4 py-1.5',
    title: 'text-foreground/80',
    reshared: 'text-muted-foreground/70',
    link: 'text-sky-600 dark:text-sky-400',
  },
  overlay: {
    container: 'gap-1',
    title: 'text-white/90',
    reshared: 'text-white/60',
    link: 'text-sky-300',
  },
} as const

/**
 * Story 专属元信息行。
 *
 * 仅 story / highlight 渲染：精选集标题、转发来源、链接贴纸（swipe-up CTA）。
 * 普通帖子返回 null（不额外渲染）；三项都缺时也不渲染空行。
 */
export function IGStoryMeta({ post, tone = 'card', className }: IGStoryMetaProps) {
  if (!isStoryPost(post))
    return null

  const { highlight_title, resharedFrom, storyLink } = post
  if (!highlight_title && !resharedFrom && !storyLink)
    return null

  const styles = TONE_STYLES[tone]

  return (
    <div className={cn('flex flex-col', styles.container, className)}>
      {highlight_title && (
        <p className={cn('text-xs font-medium', styles.title)}>
          精选 ·
          {' '}
          {highlight_title}
        </p>
      )}

      {resharedFrom && (
        <p className={cn('text-xs', styles.reshared)}>
          转自 @
          {resharedFrom.username}
        </p>
      )}

      {storyLink && (
        <a
          href={storyLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn('inline-flex items-center gap-1.5 text-xs hover:underline', styles.link)}
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
