import type { EnrichedTweet, MediaDetails } from '~/types'
import { MediaCarousel, MediaCarouselPage } from '~/components/ui/media-carousel'
import { Skeleton } from '~/components/ui/skeleton'
import { clampAspectRatio, getMediaAspectRatio } from '~/lib/media-aspect'
import { cn } from '~/lib/utils'
import { getMediaUrl } from '../utils'
import { TweetMediaVideo } from './tweet-media-video'

/**
 * 网格最多 4 张（官方经典 1 / 2 / 3 / 4 布局）；X 单条推文最多 20 张，
 * 超过 4 张继续用 2 列网格会撑成十几行、比例全乱，改横向轮播。
 */
export const MEDIA_GRID_MAX = 4

/**
 * 轮播最大高度：高度封顶后页宽按图片比例收窄，竖向长图变成完整窄条（官方同款形态），
 * 既不被裁也不无限拉高。
 */
export const CAROUSEL_MAX_HEIGHT = 'min(640px, 80vh)'

/** 比例夹界只兜病态数据（1:10 以下的细条 / 4:1 以上的长横幅），常规构图按原比例 */
export const CAROUSEL_ASPECT_MIN = 0.1
export const CAROUSEL_ASPECT_MAX = 4

function getSkeletonStyle(media: MediaDetails, itemCount: number) {
  let paddingBottom = 56.25 // default of 16x9

  // if we only have 1 item, show at original ratio
  if (itemCount === 1) {
    paddingBottom
      = (100 / media.original_info.width) * media.original_info.height
  }

  // if we have 2 items, double the default to be 16x9 total
  if (itemCount === 2)
    paddingBottom = paddingBottom * 2

  return {
    width: media.type === 'photo'
      ? undefined
      : 'unset',
    paddingBottom: `${paddingBottom}%`,
  }
}

interface MediaItemProps {
  media: MediaDetails
  itemCount: number
  /** 竖向内联模式：图片按原比例全宽排布，不裁切 */
  inline: boolean
  /** 网格用骨架撑高；轮播页由容器比例撑高 */
  showSkeleton: boolean
  onClick?: () => void
}

function MediaItem({ media, itemCount, inline, showSkeleton, onClick }: MediaItemProps) {
  if (media.type !== 'photo') {
    return (
      <div className="relative h-full w-full flex items-center justify-center">
        {showSkeleton && (
          <div className="pb-[56.25%] w-full block" style={getSkeletonStyle(media, itemCount)} />
        )}
        <TweetMediaVideo media={media} />
      </div>
    )
  }

  return (
    <div
      className="relative h-full w-full flex items-center justify-center no-underline outline-none cursor-zoom-in"
      onClick={onClick}
    >
      {showSkeleton && (
        <Skeleton
          className="pb-[56.25%] w-full block"
          style={getSkeletonStyle(media, itemCount)}
        />
      )}
      <img
        src={getMediaUrl(media)}
        alt={media.ext_alt_text || 'Image'}
        // AC-PERF-001：长链/大量媒体不 eager 加载全量图（截图等待只等视口内图片）
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className={cn(
          'm-0 object-cover object-center w-full h-full',
          inline ? 'relative' : 'absolute inset-0',
        )}
        draggable
      />
    </div>
  )
}

interface Props {
  tweet: EnrichedTweet
  quoted?: boolean
  showCoverOnly?: boolean
  onMediaClick?: (index: number) => void
}

export function TweetMedia({ tweet, quoted, onMediaClick }: Props) {
  const mediaDetails = tweet.mediaDetails ?? []
  const length = mediaDetails.length
  const isInlineMedia = !!tweet.isInlineMedia
  const isCarousel = length > MEDIA_GRID_MAX && !isInlineMedia

  if (length === 0)
    return null

  const first = mediaDetails[0]!

  // 只有一个图片，且是竖屏
  const onlyHasOnePhotoPortrait = length === 1
    && first.type === 'photo'
    && first.original_info.height > first.original_info.width

  // 只有一个视频，且是竖屏
  const isOnlyOneVideoPortrait = length === 1
    && first.type !== 'photo'
    && first.video_info.aspect_ratio[0] < first.video_info.aspect_ratio[1]

  return (
    <div
      className={cn(
        'mt-3 overflow-hidden relative',
        !quoted && 'border border-[rgb(207,217,222)] dark:border-[rgb(66,83,100)] rounded-xl',
        onlyHasOnePhotoPortrait && 'max-w-[85%]',
        isOnlyOneVideoPortrait && 'sm:max-w-[72%]',
      )}
    >
      {isCarousel
        ? (
            <MediaCarousel
              itemCount={length}
              ariaLabel={`媒体，共 ${length} 张`}
              showArrows={!quoted}
              trackClassName="gap-1"
            >
              {mediaDetails.map((media, index) => {
                // 每页按自己的原比例：高度到顶后宽度收窄，竖构图完整显示不被裁
                const pageAspect = clampAspectRatio(
                  getMediaAspectRatio(media),
                  CAROUSEL_ASPECT_MIN,
                  CAROUSEL_ASPECT_MAX,
                )

                return (
                  <MediaCarouselPage
                    key={media.media_url_https}
                    className="basis-[60%] snap-center overflow-hidden bg-muted/10"
                    style={{
                      aspectRatio: String(pageAspect),
                      maxWidth: `calc(${pageAspect} * ${CAROUSEL_MAX_HEIGHT})`,
                    }}
                  >
                    <MediaItem
                      media={media}
                      itemCount={length}
                      inline={false}
                      showSkeleton={false}
                      onClick={() => onMediaClick?.(index)}
                    />
                  </MediaCarouselPage>
                )
              })}
            </MediaCarousel>
          )
        : (
            <div
              className={cn(
                'grid grid-auto-rows-[1fr] gap-0.5 h-full w-full',
                isInlineMedia && 'flex flex-col gap-0',
                length > 1 && 'grid-cols-2',
                length === 3 && '[&>*:first-child]:row-span-2',
                length > MEDIA_GRID_MAX && 'grid-cols-3',
              )}
            >
              {mediaDetails.map((media, index) => (
                <MediaItem
                  key={media.media_url_https}
                  media={media}
                  itemCount={length}
                  inline={isInlineMedia}
                  showSkeleton={!isInlineMedia}
                  onClick={() => onMediaClick?.(index)}
                />
              ))}
            </div>
          )}
    </div>
  )
}
