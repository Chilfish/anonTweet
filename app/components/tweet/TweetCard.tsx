import type { EnrichedTweet } from '~/types'
import { useMemo } from 'react'
import { MediaImage } from '~/components/ui/media'
import { useProxyMedia } from '~/lib/stores/appConfig'
import { cn } from '~/lib/utils'
import { TrendingCardView } from './TrendingCard'

/**
 * Safely extracts the hostname from a URL string.
 * @param url The URL string.
 * @returns The hostname or null if the URL is invalid.
 */
function getDomainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname
  }
  catch {
    return null
  }
}

interface CardImageProps {
  imageUrl: string
  altText: string
  isLarge?: boolean
}

/**
 * 统一媒体三态（加载/错误/成功）已由 MediaImage 承担（app/components/ui/media.tsx）：
 * 图片加载失败时渲染默认占位块（MediaFallback），不再整块塌陷（P2-2）。
 */
function CardImage({ imageUrl, altText, isLarge = false }: CardImageProps) {
  const proxyMedia = useProxyMedia()

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted/50 rounded',
        isLarge ? 'aspect-[1.91/1]' : 'w-20 h-20 flex-shrink-0',
      )}
    >
      <MediaImage
        src={proxyMedia(imageUrl)}
        alt={altText}
        className={cn(
          'h-full w-full object-cover',
          isLarge ? 'transition-transform duration-300 hover:scale-[1.02]' : '',
        )}
        loading="lazy"
      />
      {isLarge && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
      )}
    </div>
  )
}

interface CardContentProps {
  domain: string | null
  title: string | null
  description: string | null
  compact?: boolean
}

/**
 * 截断交给 CSS line-clamp（P3-1：移除 JS truncateText 双重截断 + 代理对切坏风险），
 * 完整文本由 title 属性承载（hover/读屏可获取全文）。
 */
function CardContent({ domain, title, description, compact = false }: CardContentProps) {
  return (
    <div className={cn('space-y-2 p-3')}>
      {domain && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 truncate font-medium">
          {domain}
        </div>
      )}

      {title && (
        <h3
          title={title}
          className="font-semibold text-[1rem] leading-tight line-clamp-2 text-foreground/90"
        >
          {title}
        </h3>
      )}

      {description && (
        <p
          className={cn(
            'text-xs text-muted-foreground/70 leading-relaxed',
            compact ? 'line-clamp-2' : 'line-clamp-3',
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}

interface TweetLinkCardProps {
  tweet: EnrichedTweet
  className?: string
}

export function TweetLinkCard({ tweet, className }: TweetLinkCardProps) {
  const { card } = tweet

  const cardData = useMemo(() => {
    if (!card || (!card.title && !card.description && !card.imageUrl)) {
      return null
    }

    const hasImage = !!card.imageUrl
    const isLargeImageCard = hasImage && (
      card.type === 'unified_card'
      || card.type === 'summary_large_image'
    )

    const displayDomain = card.domain || (card.url ? getDomainFromUrl(card.url) : null)

    return {
      url: card.url,
      imageUrl: card.imageUrl,
      hasImage,
      isLargeImageCard,
      domain: displayDomain,
      title: card.title ?? null,
      description: card.description ?? null,
    }
  }, [card])

  // 官方 Trending 卡片变体优先（有 jetfuel 结构化数据时渲染；解析失败/缺数据自然落普通卡路径）。
  // 判断提到 cardData 早退之前：trending 非空即渲染，不依赖 title/description/image 合并不变量（P3-2）。
  if (card?.trending) {
    return <TrendingCardView trending={card.trending} className={className} />
  }

  // 无有效卡片数据：不渲染
  if (!cardData) {
    return null
  }

  const { url, imageUrl, hasImage, isLargeImageCard, domain, title, description } = cardData

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'rounded-md mt-2 block border border-border/60',
        className,
      )}
    >
      {isLargeImageCard ? (
        <>
          <CardImage imageUrl={imageUrl!} altText={title || 'Link preview'} isLarge />
          <CardContent domain={domain} title={title} description={description} />
        </>
      ) : hasImage ? (
        <div className="flex">
          <CardImage imageUrl={imageUrl!} altText={title || 'Link preview'} />
          <div className="flex-1 min-w-0">
            <CardContent domain={domain} title={title} description={description} compact />
          </div>
        </div>
      ) : (
        <CardContent domain={domain} title={title} description={description} />
      )}
    </a>
  )
}
