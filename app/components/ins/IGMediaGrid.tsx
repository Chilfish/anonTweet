import type { IGMedia } from '~/types'
import { ImageIcon, PlayIcon } from 'lucide-react'
import { useCallback, useState } from 'react'
import { MediaImage, MediaVideo } from '~/components/ui/media'
import { cn } from '~/lib/utils'

interface IGMediaGridProps {
  media: IGMedia[]
  maxVisible?: number
  className?: string
}

/**
 * Instagram 九宫格 + 圆点指示器。
 *
 * - `grid-cols-3 gap-[1px]` 标准三列
 * - `aspect-square object-cover` 防崩塌
 * - 超过 maxVisible（默认 9）用毛玻璃 "+N" 折叠
 * - 多图时渲染横向圆点指示器（Instagram 风格）
 */
export function IGMediaGrid({ media, maxVisible = 9, className }: IGMediaGridProps) {
  const [expanded, setExpanded] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)

  const shouldFold = media.length > maxVisible && !expanded
  const visibleMedia = shouldFold ? media.slice(0, maxVisible) : media
  const hiddenCount = media.length - maxVisible

  const handleExpand = useCallback(() => setExpanded(true), [])

  if (!media.length)
    return null

  return (
    <div className={className}>
      {/* 宫格 */}
      <div
        className={cn(
          'grid gap-[1px] bg-muted/20',
          'grid-cols-1',
          media.length === 2 && 'grid-cols-2',
          media.length >= 3 && 'grid-cols-3',
        )}
      >
        {visibleMedia.map((m, i) => {
          const isLast = shouldFold && i === maxVisible - 1
          return (
            <div
              key={m.media_id || i}
              className={cn(
                'relative aspect-square overflow-hidden bg-muted/10',
                // 单图不限高，保持原比例
                media.length === 1 && 'aspect-auto',
              )}
            >
              {m.type === 'video'
                ? (
                    <MediaVideo
                      src={m.video_url!}
                      preload="metadata"
                      containerClassName="size-full"
                    />
                  )
                : (
                    <MediaImage
                      src={m.display_url}
                      alt={`${i + 1}`}
                      containerClassName="size-full"
                      className="object-cover"
                    />
                  )}

              {m.type === 'video' && !isLast && (
                <div className="absolute top-2 right-2 size-5 rounded-full bg-black/50 flex items-center justify-center">
                  <PlayIcon className="size-3 text-white fill-white ml-0.5" />
                </div>
              )}

              {isLast && (
                <button
                  onClick={handleExpand}
                  className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-lg transition-colors duration-200 hover:bg-black/55 group cursor-pointer"
                  aria-label={`展开剩余 ${hiddenCount} 张`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <ImageIcon className="size-5 text-white/70 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-white font-semibold text-lg tabular-nums">
                      +
                      {hiddenCount}
                    </span>
                  </div>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Instagram 圆点指示器 — 多图时显示 */}
      {media.length > 1 && !shouldFold && (
        <div className="flex items-center justify-center gap-1 py-2">
          {media.map((_, i) => (
            <span
              key={i}
              className={cn(
                'size-1.5 rounded-full transition-all duration-200',
                i === currentIdx
                  ? 'bg-[#3896F4] scale-110'
                  : 'bg-muted-foreground/25',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
