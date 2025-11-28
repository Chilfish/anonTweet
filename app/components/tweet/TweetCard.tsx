import type { EnrichedTweet } from '~/lib/react-tweet'
import { cn, proxyMedia } from '~/lib/utils'

interface TweetLinkCardProps {
  tweet: EnrichedTweet
  className?: string
}

export function TweetLinkCard({ tweet, className }: TweetLinkCardProps) {
  const { card } = tweet

  if (!card)
    return null

  // Validate card data - ensure we have at least title or description
  if (!card.title && !card.description && !card.imageUrl) {
    return null
  }

  // Determine layout based on card type and image availability
  const hasImage = !!card.imageUrl
  const isLargeImageCard = hasImage && (
    card.type === 'unified_card'
    || card.type === 'summary_large_image'
  )

  // Truncate long text for better display
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength)
      return text
    return `${text.slice(0, maxLength).trim()}...`
  }

  // Safe domain extraction
  const displayDomain = card.domain || (card.url
    ? (() => {
        try {
          return new URL(card.url).hostname
        }
        catch {
          return null
        }
      })()
    : null)

  // Safe title and description with fallbacks
  const displayTitle = card.title ? truncateText(card.title, 120) : null
  const displayDescription = card.description ? truncateText(card.description, 200) : null

  // Common content component
  const CardContent = ({ compact = false }: { compact?: boolean }) => (
    <div className={cn('space-y-2', compact ? 'p-3' : 'p-3')}>
      {displayDomain && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 truncate font-medium">
          {displayDomain}
        </div>
      )}

      {displayTitle && (
        <h3 className="font-semibold text-[1rem] leading-tight line-clamp-2 text-foreground/90">
          {displayTitle}
        </h3>
      )}

      {displayDescription && (
        <p className={cn(
          'text-xs text-muted-foreground/70 leading-relaxed',
          compact ? 'line-clamp-2' : 'line-clamp-3',
        )}
        >
          {displayDescription}
        </p>
      )}
    </div>
  )

  // Image component with error handling
  const CardImage = ({ isLarge = false }: { isLarge?: boolean }) => (
    <div className={cn(
      'relative overflow-hidden bg-muted/50 rounded',
      isLarge ? 'aspect-[16/9]' : 'w-20 h-20 flex-shrink-0',
    )}
    >
      <img
        src={proxyMedia(card.imageUrl)}
        alt={card.title || 'Link preview'}
        className={cn(
          'h-full w-full object-cover',
          isLarge ? 'transition-transform duration-300 hover:scale-[1.02]' : '',
        )}
        loading="lazy"
        onError={(e) => {
          const container = e.currentTarget.parentElement
          if (container) {
            container.style.display = 'none'
          }
        }}
      />
      {isLarge && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
      )}
    </div>
  )

  return (
    <a
      href={card.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'rounded-md mt-2 block border border-border/60',
        className,
      )}
    >
      {/* Large Image Layout (YouTube, summary_large_image, etc.) */}
      {isLargeImageCard ? (
        <>
          <CardImage isLarge />
          <CardContent />
        </>
      ) : hasImage ? (
        /* Small Image Layout (Spotify, etc.) */
        <div className="flex">
          <CardImage />
          <div className="flex-1 min-w-0">
            <CardContent compact />
          </div>
        </div>
      ) : (
        /* Text-only Layout */
        <CardContent />
      )}
    </a>
  )
}
