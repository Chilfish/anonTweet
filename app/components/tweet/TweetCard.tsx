import type { EnrichedTweet, TrendingCardInfo } from '~/types'
import { useMemo, useState } from 'react'
import { MediaImage } from '~/components/ui/media'
import { useProxyMedia } from '~/lib/stores/appConfig'
import { cn } from '~/lib/utils'

/**
 * Truncates a string to a maximum length, appending '...'.
 * @param text The text to truncate.
 * @param maxLength The maximum length of the text.
 * @returns The truncated text.
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength).trim()}...`
}

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

function CardImage({ imageUrl, altText, isLarge = false }: CardImageProps) {
  const [isError, setIsError] = useState(false)
  const proxyMedia = useProxyMedia()

  if (isError) {
    return null
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted/50 rounded',
        isLarge ? 'aspect-[16/9]' : 'w-20 h-20 flex-shrink-0',
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
        onError={() => setIsError(true)}
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

function CardContent({ domain, title, description, compact = false }: CardContentProps) {
  return (
    <div className={cn('space-y-2 p-3')}>
      {domain && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 truncate font-medium">
          {domain}
        </div>
      )}

      {title && (
        <h3 className="font-semibold text-[1rem] leading-tight line-clamp-2 text-foreground/90">
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

/**
 * Trending 卡片变体 —— 还原官方 X Trending 卡片渲染结构
 * （参考 cache/trending.html：aspect 18:10 大图 + 右下覆盖层：
 *   meta 行 → 标题(line-clamp-3) → 头像组+posts → 描述(line-clamp-2)）。
 */
function TrendingCardView({ trending, className }: { trending: TrendingCardInfo, className?: string }) {
  const proxyMedia = useProxyMedia()

  return (
    <a
      href={trending.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'block overflow-hidden rounded-md mt-2 border border-border/60',
        className,
      )}
    >
      <div className="relative aspect-[18/10] bg-muted/50">
        <MediaImage
          src={proxyMedia(trending.imageUrl)}
          alt={trending.title}
          className="absolute inset-0 size-full object-cover"
          loading="lazy"
        />
        {/* 底部渐变遮罩，保证文字可读 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-3 text-white">
          {/* meta 行：分类（+ 可选日期），官方以 • 分隔 */}
          {(trending.categories.length > 0 || trending.postsCount) && (
            <div className="flex items-center gap-1 text-xs font-medium text-white/80">
              {trending.categories.map((cat, i) => (
                <span key={cat} className="inline-flex items-center gap-1">
                  {i > 0 && <span>•</span>}
                  <span>{cat}</span>
                </span>
              ))}
            </div>
          )}

          {/* 标题 */}
          <h3 className="line-clamp-3 font-semibold text-sm leading-tight text-white drop-shadow-sm">
            {trending.title}
          </h3>

          {/* 头像组 + posts 计数 */}
          {(trending.avatars.length > 0 || trending.postsCount) && (
            <div className="flex items-center gap-1.5 text-xs text-white/85">
              {trending.avatars.length > 0 && (
                <span className="flex -space-x-1.5">
                  {trending.avatars.slice(0, 3).map(avatar => (
                    <img
                      key={avatar}
                      src={proxyMedia(avatar)}
                      alt=""
                      className="size-5 rounded-full border border-white/50 bg-white/20"
                      loading="lazy"
                    />
                  ))}
                </span>
              )}
              {trending.postsCount && (
                <span>
                  •
                  {trending.postsCount}
                </span>
              )}
            </div>
          )}

          {/* 描述 */}
          {trending.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-white/90">
              {trending.description}
            </p>
          )}
        </div>
      </div>
    </a>
  )
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
    const displayTitle = card.title ? truncateText(card.title, 120) : null
    const displayDescription = card.description ? truncateText(card.description, 200) : null

    return {
      url: card.url,
      imageUrl: card.imageUrl,
      hasImage,
      isLargeImageCard,
      domain: displayDomain,
      title: displayTitle,
      description: displayDescription,
    }
  }, [card])

  // 无有效卡片数据：不渲染
  if (!cardData) {
    return null
  }

  // 官方 Trending 卡片变体：有 jetfuel 结构化数据时优先渲染
  if (card?.trending) {
    return <TrendingCardView trending={card.trending} className={className} />
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
