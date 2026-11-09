import type { CSSProperties } from 'react'
import type { CardCarouselImage, LinkPreviewCard } from '~/types'
import { ChevronLeft, ChevronRight, GalleryHorizontalEnd, LayoutGrid, Play } from 'lucide-react'
import { useRef, useState } from 'react'
import { MediaImage } from '~/components/ui/media'
import { normalizeMediaUrl } from '~/lib/media-url'
import { useProxyMedia } from '~/lib/stores/appConfig'
import { useScreenshoting } from '~/lib/stores/hooks'
import { cn } from '~/lib/utils'

/**
 * 多图轮播链接卡（unified_card / image_carousel_website）。
 *
 * 两种形态：
 * - 轮播（默认）：官方同款横向 scroll-snap，箭头 + 圆点，单页比例取首图；
 * - 平铺：网格一次展示全部图片，方便阅读与截图；截图模式（`screenshoting`）
 *   自动强制平铺，避免 off-screen 页在导出 PNG 中被裁掉。
 *
 * 交互解耦：每张图/底部信息各自是 <a>，箭头是独立 <button> 兄弟节点，
 * 避免 <a> 内嵌按钮的无效交互结构。
 */

function getDomainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname
  }
  catch {
    return null
  }
}

/** 首图比例（夹在 0.6–1.0，防止极端长图撑爆卡片） */
function aspectStyle(image?: CardCarouselImage): CSSProperties {
  const ratio = image && image.width > 0 && image.height > 0
    ? image.width / image.height
    : 0.8
  return { aspectRatio: `${Math.min(1, Math.max(0.6, ratio))}` }
}

/** 视频时长 badge：6006ms → 0:06；超过 1 小时 → 1:02:03 */
function formatDuration(ms?: number): string | null {
  if (typeof ms !== 'number' || ms <= 0)
    return null
  const total = Math.round(ms / 1000)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const two = (value: number) => String(value).padStart(2, '0')
  return hours > 0
    ? `${hours}:${two(minutes)}:${two(seconds)}`
    : `${minutes}:${two(seconds)}`
}

export function CarouselCardView({
  card,
  className,
}: {
  card: LinkPreviewCard
  className?: string
}) {
  const images = card.images ?? []
  const proxyMedia = useProxyMedia()
  const isScreenshoting = useScreenshoting()
  const [activeIndex, setActiveIndex] = useState(0)
  const [tiled, setTiled] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  if (images.length === 0)
    return null

  const effectiveTiled = tiled || isScreenshoting
  const mediaFirst = card.mediaFirst ?? true
  const domain = card.domain || (card.url
    ? getDomainFromUrl(card.url)
    : null)
  const mediaAspect = aspectStyle(images[0])

  const scrollToIndex = (index: number) => {
    const track = trackRef.current
    if (!track)
      return
    const clamped = Math.min(Math.max(index, 0), images.length - 1)
    track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' })
  }

  const handleScroll = () => {
    const track = trackRef.current
    if (!track)
      return
    const width = track.clientWidth
    if (!width)
      return
    setActiveIndex(Math.min(images.length - 1, Math.max(0, Math.round(track.scrollLeft / width))))
  }

  const renderMedia = (media: CardCarouselImage, index: number, tiledMode: boolean) => {
    const isVideo = media.type === 'video'
    const duration = isVideo
      ? formatDuration(media.video?.durationMs)
      : null

    return (
      <a
        key={`${index}-${media.url}`}
        href={media.href || card.url || undefined}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={isVideo
          ? `视频链接${domain
            ? `：${domain}`
            : ''}`
          : images.length > 1
            ? `第 ${index + 1} 个，共 ${images.length} 个`
            : undefined}
        className={cn(
          'relative block bg-muted/40',
          tiledMode ? 'w-full' : 'w-full shrink-0 snap-center',
        )}
        style={tiledMode
          ? aspectStyle(media)
          : mediaAspect}
      >
        <MediaImage
          src={proxyMedia(normalizeMediaUrl(media.url))}
          alt=""
          className="absolute inset-0 size-full object-cover"
          loading="lazy"
          decoding="async"
          loadingFallback={media.color
            ? <div className="absolute inset-0" style={{ backgroundColor: media.color }} />
            : undefined}
        />

        {/* 视频卡只展示封面 + 播放按钮 + 时长，不做内嵌播放 */}
        {isVideo && (
          <>
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-black/45 text-white shadow-sm">
                <Play className="size-5 translate-x-px fill-current" />
              </span>
            </span>
            {duration && (
              <span className="pointer-events-none absolute right-2 bottom-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium tabular-nums text-white">
                {duration}
              </span>
            )}
          </>
        )}
      </a>
    )
  }

  const media = images.length === 1
    ? (
        <div className="relative" role="group" aria-label="媒体">
          {renderMedia(images[0]!, 0, true)}
        </div>
      )
    : effectiveTiled
      ? (
          <div
            className={cn('grid gap-0.5', images.length >= 4
              ? 'grid-cols-3'
              : 'grid-cols-2')}
            role="group"
            aria-label={`媒体，共 ${images.length} 个`}
          >
            {images.map((image, index) => renderMedia(image, index, true))}
          </div>
        )
      : (
          <div
            className="relative"
            role="group"
            aria-roledescription="carousel"
            aria-label={`媒体轮播，共 ${images.length} 个`}
          >
            <div
              ref={trackRef}
              onScroll={handleScroll}
              className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {images.map((image, index) => renderMedia(image, index, false))}
            </div>

            <button
              type="button"
              aria-label="上一张"
              disabled={activeIndex === 0}
              onClick={() => scrollToIndex(activeIndex - 1)}
              className={cn(
                'absolute top-1/2 left-2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-opacity sm:flex',
                'hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none',
                activeIndex === 0 && 'pointer-events-none opacity-0',
              )}
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="下一张"
              disabled={activeIndex === images.length - 1}
              onClick={() => scrollToIndex(activeIndex + 1)}
              className={cn(
                'absolute top-1/2 right-2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-opacity sm:flex',
                'hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none',
                activeIndex === images.length - 1 && 'pointer-events-none opacity-0',
              )}
            >
              <ChevronRight className="size-5" />
            </button>

            <div
              className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/40 px-2 py-1"
              aria-hidden
            >
              {images.map((image, index) => (
                <span
                  key={`${index}-${image.url}`}
                  className={cn(
                    'size-1.5 rounded-full transition-colors',
                    index === activeIndex
                      ? 'bg-white'
                      : 'bg-white/45',
                  )}
                />
              ))}
            </div>

            <span className="sr-only" aria-live="polite">
              {`第 ${activeIndex + 1} 张，共 ${images.length} 张`}
            </span>
          </div>
        )

  const footer = (
    <div
      className={cn(
        'px-3 py-2',
        mediaFirst ? 'border-t border-border/60' : 'border-b border-border/60',
      )}
    >
      {card.title && (
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground/90">
          {card.title}
        </h3>
      )}
      {card.description && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground/70">
          {card.description}
        </p>
      )}

      <div className={cn('flex items-center gap-2', (card.title || card.description) && 'mt-1.5')}>
        <div className="min-w-0 flex-1">
          {domain && (
            <a
              href={card.url || undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-xs font-medium text-muted-foreground hover:underline"
            >
              {domain}
            </a>
          )}
        </div>

        {card.ctaLabel && (
          <a
            href={card.url || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background transition-opacity hover:opacity-80"
          >
            {card.ctaLabel}
          </a>
        )}

        {!isScreenshoting && images.length > 1 && (
          <button
            type="button"
            aria-pressed={effectiveTiled}
            title={effectiveTiled ? '切换为轮播' : '切换为平铺'}
            onClick={() => {
              setTiled(value => !value)
              setActiveIndex(0)
              trackRef.current?.scrollTo({ left: 0 })
            }}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {effectiveTiled
              ? <GalleryHorizontalEnd className="size-4" />
              : <LayoutGrid className="size-4" />}
            <span className="sr-only">{effectiveTiled ? '切换为轮播' : '切换为平铺'}</span>
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className={cn('mt-2 overflow-hidden rounded-md border border-border/60', className)}>
      {mediaFirst
        ? (
            <>
              {media}
              {footer}
            </>
          )
        : (
            <>
              {footer}
              {media}
            </>
          )}
    </div>
  )
}
