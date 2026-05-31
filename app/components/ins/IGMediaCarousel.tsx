import type { IGMedia } from '~/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '~/lib/utils'

interface IGMediaCarouselProps {
  media: IGMedia[]
  className?: string
}

/**
 * Instagram 多图轮播组件。
 *
 * 使用原生 CSS scroll-snap 实现丝滑动效，
 * 底部圆点指示器实时同步当前索引。
 */
export function IGMediaCarousel({ media, className }: IGMediaCarouselProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el)
      return
    const { scrollLeft, clientWidth } = el
    const idx = Math.round(scrollLeft / clientWidth)
    setCurrentIdx(idx)
  }, [])

  // 监听滚动更新圆点
  useEffect(() => {
    const el = scrollRef.current
    if (!el)
      return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const scrollTo = (idx: number) => {
    scrollRef.current?.scrollTo({
      left: idx * (scrollRef.current.clientWidth),
      behavior: 'smooth',
    })
  }

  if (!media?.length)
    return null

  return (
    <div className={cn('relative group', className)}>
      {/* 媒体容器 */}
      <div
        ref={scrollRef}
        className={cn(
          'flex overflow-x-auto snap-x snap-mandatory scroll-smooth',
          'rounded-xl bg-black/5 dark:bg-white/5',
          'scrollbar-hidden',
        )}
      >
        {media.map((m, i) => (
          <div
            key={m.media_id || i}
            className="snap-start w-full flex-shrink-0 relative"
          >
            {m.type === 'video'
              ? (
                  <video
                    src={m.video_url!}
                    controls
                    preload="metadata"
                    className="w-full"
                    poster={m.display_url}
                  />
                )
              : (
                  <img
                    src={m.display_url}
                    alt={`Media ${i + 1}`}
                    loading="lazy"
                    className="w-full"
                  />
                )}
          </div>
        ))}
      </div>

      {/* 左右箭头（多图时显示） */}
      {media.length > 1 && (
        <>
          {currentIdx > 0 && (
            <button
              onClick={() => scrollTo(currentIdx - 1)}
              className={cn(
                'absolute left-2 top-1/2 -translate-y-1/2',
                'w-8 h-8 rounded-full bg-background/80 shadow',
                'flex items-center justify-center',
                'opacity-0 group-hover:opacity-100 transition-opacity',
              )}
              aria-label="上一张"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {currentIdx < media.length - 1 && (
            <button
              onClick={() => scrollTo(currentIdx + 1)}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2',
                'w-8 h-8 rounded-full bg-background/80 shadow',
                'flex items-center justify-center',
                'opacity-0 group-hover:opacity-100 transition-opacity',
              )}
              aria-label="下一张"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </>
      )}

      {/* 圆点指示器（多图时显示） */}
      {media.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {media.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                i === currentIdx
                  ? 'bg-primary scale-110'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50',
              )}
              aria-label={`第 ${i + 1} 张`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
