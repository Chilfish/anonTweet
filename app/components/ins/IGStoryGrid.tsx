import type { IGPost } from '~/types'
import { Check, Link2, PlayIcon } from 'lucide-react'
import { MediaImage } from '~/components/ui/media'
import { cn } from '~/lib/utils'
import { getImageFitClass } from './IGMediaGrid'

interface IGStoryGridProps {
  posts: IGPost[]
  /** 选择模式：点格 = 勾选（缺省时点格 = 打开查看器） */
  selectable?: boolean
  selected?: ReadonlySet<string>
  onOpen?: (index: number) => void
  onToggle?: (id: string) => void
  className?: string
}

/**
 * 相册缩略图。
 *
 * 视频用 `display_url`（上游给的封面帧）而不是拉 video metadata —— 32 格网格里
 * 逐个预载视频元数据是纯浪费，播放指示由角标承担。
 */
function StoryThumb({ media }: { media: IGPost['media'][number] }) {
  if (!media.display_url)
    return <span className="absolute inset-0 bg-muted/20" />

  return (
    <MediaImage
      src={media.display_url}
      alt=""
      containerClassName="size-full"
      className={getImageFitClass(media)}
    />
  )
}

/**
 * 快拍网格（相册）。
 *
 * 浏览态点击打开全屏查看器；选择态点击切换勾选。每格是有完整无障碍名的 `<button>`，
 * 键盘 Tab 顺序即视觉顺序（不做 roving tabindex：几十格仍可预期地逐个到达）。
 */
export function IGStoryGrid({
  posts,
  selectable = false,
  selected,
  onOpen,
  onToggle,
  className,
}: IGStoryGridProps) {
  return (
    <div
      className={cn('grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-5', className)}
      data-slot="story-grid"
    >
      {posts.map((post, index) => {
        const media = post.media?.[0]
        const isSelected = selected?.has(post.id) ?? false
        const position = index + 1

        return (
          <button
            key={post.id}
            type="button"
            data-selected={selectable ? isSelected : undefined}
            aria-pressed={selectable ? isSelected : undefined}
            aria-label={selectable
              ? `${isSelected ? '取消选择' : '选择'}第 ${position} 条快拍`
              : `查看第 ${position} 条快拍`}
            onClick={() => (selectable ? onToggle?.(post.id) : onOpen?.(index))}
            className="group relative aspect-square overflow-hidden bg-muted/10 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          >
            {media ? <StoryThumb media={media} /> : <span className="absolute inset-0 bg-muted/20" />}

            {/* 浏览态：hover 轻微压暗，暗示可点开 */}
            {!selectable && (
              <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            )}

            {media?.type === 'video' && (
              <span className="pointer-events-none absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-black/50">
                <PlayIcon className="ml-0.5 size-3 fill-white text-white" />
              </span>
            )}

            {post.storyLink && (
              <span
                title="含链接贴纸"
                className="pointer-events-none absolute bottom-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-black/55 text-white"
              >
                <Link2 className="size-3" aria-hidden="true" />
              </span>
            )}

            {selectable && (
              <>
                {isSelected && (
                  <span className="pointer-events-none absolute inset-0 ring-2 ring-primary ring-inset" />
                )}
                <span
                  className={cn(
                    'pointer-events-none absolute left-1.5 top-1.5 flex size-5 items-center justify-center rounded-full border transition-colors',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-white/80 bg-black/25 text-transparent',
                  )}
                >
                  <Check className="size-3.5" />
                </span>
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
