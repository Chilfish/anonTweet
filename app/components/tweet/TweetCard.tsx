import type { EnrichedTweet } from '~/lib/react-tweet'
import { useMemo, useState } from 'react'
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
      <img
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

  // 如果没有有效的卡片数据，则不渲染任何内容
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
