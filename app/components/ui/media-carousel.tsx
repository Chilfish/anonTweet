import type { HTMLAttributes, ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from '~/lib/utils'

/**
 * 横向 scroll-snap 媒体轮播（原生滚动，不引第三方库）。
 * 单页宽度由调用方通过 `MediaCarouselPage` 的 className 决定：整页（`basis-full`）
 * 或露边（`basis-[85%]`，露出下一张暗示可滑动）。
 */
interface MediaCarouselProps {
  itemCount: number
  ariaLabel: string
  children: ReactNode
  className?: string
  trackClassName?: string
  /** counter：`1 / 20` 胶囊（数量多时唯一可读的指示）；dots：圆点（少量图片） */
  indicator?: 'counter' | 'dots'
  showArrows?: boolean
}

/** 轮播单页：由调用方给出宽度与比例，内容自己铺满（通常是 `absolute inset-0`） */
export function MediaCarouselPage({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('relative shrink-0 snap-start', className)} {...props} />
}

export function MediaCarousel({
  itemCount,
  ariaLabel,
  children,
  className,
  trackClassName,
  indicator = 'counter',
  showArrows = true,
}: MediaCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  /**
   * 页宽可以不一致（竖向长图按比例收窄），所以按子项位置算静止滚动量：
   * 与 `snap-center` 一致 —— 让该页中心对准轨道中心，再夹到可滚动范围内。
   */
  const restingScrollLeft = (track: HTMLDivElement, index: number) => {
    const child = track.children[Math.min(Math.max(index, 0), itemCount - 1)] as HTMLElement | undefined
    if (!child)
      return 0
    const centered = child.offsetLeft - track.offsetLeft - (track.clientWidth - child.offsetWidth) / 2
    const max = Math.max(0, track.scrollWidth - track.clientWidth)
    return Math.min(Math.max(centered, 0), max)
  }

  const scrollToIndex = (index: number) => {
    const track = trackRef.current
    if (!track)
      return
    track.scrollTo({
      left: restingScrollLeft(track, index),
      behavior: 'smooth',
    })
  }

  const handleScroll = () => {
    const track = trackRef.current
    if (!track)
      return
    let closest = 0
    let minDistance = Number.POSITIVE_INFINITY
    for (let index = 0; index < itemCount; index++) {
      const distance = Math.abs(restingScrollLeft(track, index) - track.scrollLeft)
      if (distance < minDistance) {
        minDistance = distance
        closest = index
      }
    }
    setActiveIndex(current => current === closest
      ? current
      : closest)
  }

  const isFirst = activeIndex === 0
  const isLast = activeIndex === itemCount - 1

  return (
    <div
      className={cn('relative', className)}
      role="group"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className={cn(
          'flex snap-x snap-mandatory items-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          trackClassName,
        )}
      >
        {children}
      </div>

      {showArrows && (
        <>
          <button
            type="button"
            aria-label="上一张"
            disabled={isFirst}
            onClick={() => scrollToIndex(activeIndex - 1)}
            className={cn(
              'absolute top-1/2 left-2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-opacity sm:flex',
              'hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none',
              isFirst && 'pointer-events-none opacity-0',
            )}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="下一张"
            disabled={isLast}
            onClick={() => scrollToIndex(activeIndex + 1)}
            className={cn(
              'absolute top-1/2 right-2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-opacity sm:flex',
              'hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none',
              isLast && 'pointer-events-none opacity-0',
            )}
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}

      {indicator === 'dots'
        ? (
            <div
              className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/40 px-2 py-1"
              aria-hidden
            >
              {Array.from({ length: itemCount }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    'size-1.5 rounded-full transition-colors',
                    index === activeIndex
                      ? 'bg-white'
                      : 'bg-white/45',
                  )}
                />
              ))}
            </div>
          )
        : (
            <span
              className="pointer-events-none absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white"
              aria-hidden
            >
              {`${activeIndex + 1} / ${itemCount}`}
            </span>
          )}

      <span className="sr-only" aria-live="polite">
        {`第 ${activeIndex + 1} 张，共 ${itemCount} 张`}
      </span>
    </div>
  )
}
