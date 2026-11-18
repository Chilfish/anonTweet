import type { IGPost } from '~/types'
import { LayersIcon, PlayIcon } from 'lucide-react'
import { Link } from 'react-router'
import { MediaImage } from '~/components/ui/media'
import { cn } from '~/lib/utils'

interface IGProfilePostGridProps {
  posts: IGPost[]
  className?: string
}

/**
 * 主页帖子九宫格：3 列方形缩略图，点击进入 `/ins/{shortcode}` 详情页。
 *
 * 视频用 `display_url`（封面帧）而不是预载 video metadata；多图帖带叠层角标。
 */
export function IGProfilePostGrid({ posts, className }: IGProfilePostGridProps) {
  return (
    <div
      data-slot="ig-profile-grid"
      className={cn('grid grid-cols-3 gap-1 sm:gap-2', className)}
    >
      {posts.map((post, index) => {
        const media = post.media?.[0]
        const position = index + 1

        return (
          <Link
            key={post.id}
            to={`/ins/${post.id}`}
            aria-label={`查看第 ${position} 条帖子`}
            className="group relative aspect-square overflow-hidden rounded-md bg-muted/10 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            {media?.display_url
              ? (
                  <MediaImage
                    src={media.display_url}
                    alt=""
                    containerClassName="size-full"
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                  />
                )
              : <span className="absolute inset-0 bg-muted/20" />}

            {media?.type === 'video' && (
              <span className="pointer-events-none absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-black/50">
                <PlayIcon className="ml-0.5 size-3 fill-white text-white" />
              </span>
            )}

            {post.media.length > 1 && (
              <span
                title={`${post.media.length} 项媒体`}
                className="pointer-events-none absolute right-1.5 bottom-1.5 flex size-5 items-center justify-center rounded-full bg-black/55 text-white"
              >
                <LayersIcon className="size-3" aria-hidden="true" />
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
