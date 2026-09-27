import type { TweetArticle } from '~/types'
import { FileTextIcon } from 'lucide-react'
import { Link } from 'react-router'
import { MediaImage } from '~/components/ui/media'
import { normalizeMediaUrl } from '~/lib/media-url'
import { useProxyMedia } from '~/lib/stores/appConfig'
import { cn } from '~/lib/utils'

interface TweetArticleCardProps {
  article: TweetArticle
  /** 推文 id（文章页按推文 id 取数；文章 id 与推文 id 不同） */
  tweetId: string
  className?: string
}

/**
 * 推文内的 X Article 紧凑卡片：封面 + 标题 + 摘要 + 阅读入口。
 *
 * 正文不在此展开（长文会撑爆线程视图），点击进入 `/article/:tweetId` 阅读页。
 */
export function TweetArticleCard({ article, tweetId, className }: TweetArticleCardProps) {
  const proxyMedia = useProxyMedia()
  const cover = article.coverImage
  const preview = article.previewText

  return (
    <Link
      to={`/article/${tweetId}`}
      className={cn(
        'mt-2 block overflow-hidden rounded-xl border border-border/60 transition-colors hover:bg-muted/30',
        className,
      )}
    >
      {cover && (
        <div
          className="overflow-hidden bg-muted/20"
          style={{ aspectRatio: cover.width && cover.height ? `${cover.width} / ${cover.height}` : '16 / 9' }}
        >
          <MediaImage
            src={proxyMedia(normalizeMediaUrl(cover.url))}
            alt={article.title || 'Article cover'}
            containerClassName="size-full"
            className="size-full object-cover"
          />
        </div>
      )}

      <div className="space-y-2 p-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/80">
          <FileTextIcon className="size-3.5" />
          Article
        </div>

        {article.title
          ? (
              <h3 className="text-[1rem] leading-tight font-semibold text-foreground/90 line-clamp-2">
                {article.title}
              </h3>
            )
          : (
              <h3 className="text-[1rem] leading-tight font-semibold text-foreground/90">X 长文</h3>
            )}

        {preview && (
          <p className="text-xs leading-relaxed text-muted-foreground/70 line-clamp-3">
            {preview}
          </p>
        )}

        <span className="inline-block text-xs font-medium text-primary">阅读全文 →</span>
      </div>
    </Link>
  )
}
