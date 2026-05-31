import type { IGMedia } from '~/types'
import { ImageIcon, PlayIcon } from 'lucide-react'
import { useCallback, useState } from 'react'
import { MediaImage, MediaVideo } from '~/components/ui/media'
import { cn } from '~/lib/utils'

interface IGMediaGridProps {
  media: IGMedia[]
  /** 最大可见图片数，默认 9（九宫格） */
  maxVisible?: number
  className?: string
}

/**
 * Instagram 九宫格媒体组件。
 *
 * Apple HIG：
 * - `grid-cols-3` 标准三列九宫格
 * - `gap-[1px]` 模拟 IG 原生体验
 * - `aspect-square object-cover` 确保极端比例图片不崩塌
 * - 超过 maxVisible（默认 9）的图片用毛玻璃 "+N" 折叠
 *
 * 复用 {@link MediaImage} / {@link MediaVideo} 的智能加载态。
 */
export function IGMediaGrid({ media, maxVisible = 9, className }: IGMediaGridProps) {
  const [expanded, setExpanded] = useState(false)

  const shouldFold = media.length > maxVisible && !expanded
  const visibleMedia = shouldFold ? media.slice(0, maxVisible) : media
  const hiddenCount = media.length - maxVisible

  const handleExpand = useCallback(() => setExpanded(true), [])

  if (!media.length)
    return null

  return (
    <div
      className={cn(
        'grid grid-cols-3 gap-[1px]',
        media.length === 1 && 'grid-cols-1',
        media.length === 2 && 'grid-cols-2',
        className,
      )}
    >
      {visibleMedia.map((m, i) => {
        const isLast = shouldFold && i === maxVisible - 1
        return (
          <div key={m.media_id || i} className="relative aspect-square overflow-hidden bg-muted/10">
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

            {/* 视频播放图标 */}
            {m.type === 'video' && !isLast && (
              <div className="absolute top-2 right-2 size-5 rounded-full bg-black/50 flex items-center justify-center">
                <PlayIcon className="size-3 text-white fill-white ml-0.5" />
              </div>
            )}

            {/* Apple 风格 "+N" 毛玻璃折叠遮罩 */}
            {isLast && (
              <button
                onClick={handleExpand}
                className={cn(
                  'absolute inset-0 flex items-center justify-center',
                  'bg-black/45 backdrop-blur-lg',
                  'transition-colors duration-200 hover:bg-black/55',
                  'group cursor-pointer',
                )}
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
  )
}
