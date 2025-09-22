import type { EnrichedTweet } from "~/lib/react-tweet"
import { cn } from "~/lib/utils"

interface TweetLinkCardProps {
  tweet: EnrichedTweet
  className?: string
}

export function TweetLinkCard({ tweet, className }: TweetLinkCardProps) {
  const { card } = tweet
  
  if (!card) return null

  // Validate card data - ensure we have at least title or description
  if (!card.title && !card.description && !card.image) {
    return null
  }

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (card.url) {
      window.open(card.url, '_blank', 'noopener,noreferrer')
    }
  }

  // Different layouts for different card types
  const isImageCard = card.type === 'unified_card' || (card.type === 'summary' && card.image)
  const hasLargeImage = card.image && (card.image.width >= 400 || card.image.height >= 200)
  
  // Truncate long text for better display
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trim() + '...'
  }

  // Safe domain extraction
  const displayDomain = card.domain || (card.url ? (() => {
    try {
      return new URL(card.url).hostname
    } catch {
      return null
    }
  })() : null)
  
  // Safe title and description with fallbacks
  const displayTitle = card.title ? truncateText(card.title, 120) : null
  const displayDescription = card.description ? truncateText(card.description, 200) : null

  return (
    <div
      className={cn(
        "mt-3 overflow-hidden rounded-2xl border border-border/60 cursor-pointer transition-all duration-200",
        "hover:bg-accent/20 hover:border-border/80 hover:shadow-sm",
        "bg-card/50 backdrop-blur-sm",
        className
      )}
      onClick={handleCardClick}
    >
      {/* Large Image Layout (YouTube, etc.) */}
      {isImageCard && hasLargeImage && (
        <>
          <div className="relative aspect-[16/9] overflow-hidden bg-muted/50">
            <img
              src={card.image!.url}
              alt={card.title || "Link preview"}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
              loading="lazy"
              onError={(e) => {
                const container = e.currentTarget.parentElement
                if (container) {
                  container.style.display = 'none'
                }
              }}
            />
            {/* Subtle overlay for better contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
          </div>
          
          <div className="p-3 space-y-2">
            {displayDomain && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 truncate font-medium">
                {displayDomain}
              </div>
            )}
            
            {displayTitle && (
              <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground/90">
                {displayTitle}
              </h3>
            )}
            
            {displayDescription && (
              <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">
                {displayDescription}
              </p>
            )}
          </div>
        </>
      )}

      {/* Small Image Layout (Spotify, etc.) */}
      {isImageCard && !hasLargeImage && (
        <div className="flex">
          {card.image && (
            <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden bg-muted/50">
              <img
                src={card.image.url}
                alt={card.title || "Link preview"}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  const container = e.currentTarget.parentElement
                  if (container) {
                    container.style.display = 'none'
                  }
                }}
              />
            </div>
          )}
          
          <div className="flex-1 p-3 space-y-1.5 min-w-0">
            {displayDomain && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 truncate font-medium">
                {displayDomain}
              </div>
            )}
             
             {displayTitle && (
               <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground/90">
                 {displayTitle}
               </h3>
             )}
             
             {displayDescription && (
               <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">
                 {displayDescription}
               </p>
             )}
           </div>
        </div>
      )}

      {/* Text-only Layout */}
       {!isImageCard && (
         <div className="p-3 space-y-2">
            {displayDomain && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 truncate font-medium">
                {displayDomain}
              </div>
            )}
           
           {displayTitle && (
             <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground/90">
               {displayTitle}
             </h3>
           )}
           
           {displayDescription && (
             <p className="text-xs text-muted-foreground/70 line-clamp-3 leading-relaxed">
               {displayDescription}
             </p>
           )}
         </div>
       )}
    </div>
  )
}
