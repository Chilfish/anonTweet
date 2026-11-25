import type { CSSProperties, ReactNode } from 'react'
import type { CardCarouselImage, LinkPreviewCard } from '~/types'
import { GalleryHorizontalEnd, LayoutGrid, Play } from 'lucide-react'
import { useState } from 'react'
import { MediaImage } from '~/components/ui/media'
import { MediaCarousel, MediaCarouselPage } from '~/components/ui/media-carousel'
import { clampAspectRatio } from '~/lib/media-aspect'
import { normalizeMediaUrl } from '~/lib/media-url'
import { localizeCtaLabel } from '~/lib/react-tweet/utils'
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
  return {
    aspectRatio: String(clampAspectRatio(ratio, 0.6, 1)),
  }
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
  const [tiled, setTiled] = useState(false)

  if (images.length === 0)
    return null

  const effectiveTiled = tiled || isScreenshoting
  const mediaFirst = card.mediaFirst ?? true
  const domain = card.domain || (card.url
    ? getDomainFromUrl(card.url)
    : null)
  const mediaAspect = aspectStyle(images[0])

  const renderAnchor = (media: CardCarouselImage, index: number) => {
    const isVideo = media.type === 'video'
    const duration = isVideo
      ? formatDuration(media.video?.durationMs)
      : null

    return (
      <a
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
        className="absolute inset-0 block"
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

  /** 平铺网格 / 单图：每格按自己的原比例 */
  const renderTile = (media: CardCarouselImage, index: number) => (
    <div
      key={`${index}-${media.url}`}
      className="relative w-full bg-muted/40"
      style={aspectStyle(media)}
    >
      {renderAnchor(media, index)}
    </div>
  )

  /** 轮播页：统一按首图比例，滑动时不跳高 */
  const renderPage = (media: CardCarouselImage, index: number) => (
    <MediaCarouselPage
      key={`${index}-${media.url}`}
      className="w-full snap-center bg-muted/40"
      style={mediaAspect}
    >
      {renderAnchor(media, index)}
    </MediaCarouselPage>
  )

  const media: ReactNode = images.length === 1
    ? (
        <div className="relative" role="group" aria-label="媒体">
          {renderTile(images[0]!, 0)}
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
            {images.map(renderTile)}
          </div>
        )
      : (
          <MediaCarousel
            itemCount={images.length}
            ariaLabel={`媒体轮播，共 ${images.length} 个`}
            indicator="dots"
          >
            {images.map(renderPage)}
          </MediaCarousel>
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
            {localizeCtaLabel(card.ctaLabel)}
          </a>
        )}

        {!isScreenshoting && images.length > 1 && (
          <button
            type="button"
            aria-pressed={effectiveTiled}
            title={effectiveTiled ? '切换为轮播' : '切换为平铺'}
            onClick={() => setTiled(value => !value)}
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
