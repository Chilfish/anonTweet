import type { IGMedia } from '~/types'
import { ImageIcon, PlayIcon } from 'lucide-react'
import { useCallback, useState } from 'react'
import { MediaImage, MediaVideo } from '~/components/ui/media'
import { cn } from '~/lib/utils'

interface IGMediaGridProps {
  media: IGMedia[]
  /** 折叠阈值：超过此数量则折叠，默认 6（2 行 x 3 列） */
  maxVisible?: number
  className?: string
}

/**
 * Instagram 宫格媒体组件 — Apple 风格的智能折叠。
 *
 * 复用 {@link MediaImage} / {@link MediaVideo} 的智能加载态，
 * 3 列自适应网格，超过阈值时用毛玻璃 "+N" 叠加折叠，
 * 点击展开全部。
 */
export function IGMediaGrid({ media, maxVisible = 6, className }: IGMediaGridProps) {
  const [expanded, setExpanded] = useState(false)

  const isOverflow = media.length > maxVisible && !expanded
  const visibleMedia = isOverflow ? media.slice(0, maxVisible) : media
  const hiddenCount = media.length - maxVisible

  const handleExpand = useCallback(() => {
    setExpanded(true)
  }, [])

  if (!media.length)
    return null

  return (
    <div
      className={cn(
        'grid gap-0.5',
        // 响应式列数：默认 3 列，小屏 2 列
        'grid-cols-2 sm:grid-cols-3',
        'rounded-xl overflow-hidden',
        'bg-muted/20',
        className,
      )}
    >
      {visibleMedia.map((m, i) => {
        const isLast = isOverflow && i === visibleMedia.length - 1
        return (
          <div
            key={m.media_id || i}
            className={cn(
              'relative',
              'aspect-square w-full',
              'overflow-hidden',
              // 单图时跨满行，保持竖图比例
              media.length === 1 && 'sm:col-span-3 sm:aspect-[4/5]',
              // 2 图时各占半行，竖图比例
              media.length === 2 && 'sm:aspect-[4/5]',
            )}
          >
            {/* 媒体内容 */}
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
                  />
                )}

            {/* 视频标记 */}
            {m.type === 'video' && !isLast && (
              <div className="absolute top-2 right-2 size-6 rounded-full bg-black/50 flex items-center justify-center">
                <PlayIcon className="size-3 text-white fill-white ml-0.5" />
              </div>
            )}

            {/* Apple 风格 "+N" 折叠遮罩 */}
            {isLast && (
              <button
                onClick={handleExpand}
                className={cn(
                  'absolute inset-0 flex items-center justify-center',
                  'bg-black/40 backdrop-blur-md',
                  'transition-colors duration-200',
                  'hover:bg-black/50',
                  'group',
                )}
                aria-label={`展开剩余 ${hiddenCount} 张图片`}
              >
                <div className="flex flex-col items-center gap-1">
                  <ImageIcon className="size-5 text-white/80 group-hover:scale-110 transition-transform" />
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
  )
}
