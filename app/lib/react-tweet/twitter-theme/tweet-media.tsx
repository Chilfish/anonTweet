import type { EnrichedTweet, MediaDetails } from '~/types'
import { Fragment } from 'react'
import { Skeleton } from '~/components/ui/skeleton'
import { cn } from '~/lib/utils'
import { getMediaUrl } from '../utils'
import { TweetMediaVideo } from './tweet-media-video'

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
    width: media.type === 'photo' ? undefined : 'unset',
    paddingBottom: `${paddingBottom}%`,
  }
}

interface Props {
  tweet: EnrichedTweet
  quoted?: boolean
  showCoverOnly?: boolean
  onMediaClick?: (index: number) => void
}

export function TweetMedia({ tweet, quoted, onMediaClick }: Props) {
  const length = tweet.mediaDetails?.length ?? 0
  const isInlineMedia = !!tweet.isInlineMeida

  // 只有一个图片，且是竖屏
  const onlyHasOnePhotoPortrait = length === 1
    && tweet.mediaDetails?.[0]?.type === 'photo'
    && tweet.mediaDetails?.[0]?.original_info.height > tweet.mediaDetails?.[0]?.original_info.width

  // 只有一个视频，且是竖屏
  const isOnlyOneVideoPortrait = length === 1
    && tweet.mediaDetails?.[0]?.type === 'video'
    && tweet.mediaDetails?.[0]?.video_info?.aspect_ratio[0] < tweet.mediaDetails?.[0]?.video_info?.aspect_ratio[1]

  return (
    <div
      className={cn(
        'mt-3 overflow-hidden relative',
        !quoted && 'border border-[rgb(207,217,222)] dark:border-[rgb(66,83,100)] rounded-xl',
        onlyHasOnePhotoPortrait && 'max-w-[85%]',
        isOnlyOneVideoPortrait && 'sm:max-w-[72%]',
      )}
    >
      <div
        className={cn(
          'grid grid-auto-rows-[1fr] gap-0.5 h-full w-full',
          isInlineMedia && 'flex flex-col gap-0',
          length > 1 && 'grid-cols-2',
          length === 3 && '[&>*:first-child]:row-span-2',
          length > 4 && 'grid-rows-2',
        )}
      >
        {tweet.mediaDetails?.map((media, index) => (
          <Fragment key={media.media_url_https}>
            {media.type === 'photo'
              ? (
                  <div
                    className={cn(
                      'relative h-full w-full flex items-center justify-center no-underline outline-none cursor-zoom-in',
                    )}
                    onClick={() => onMediaClick?.(index)}
                  >
                    {!isInlineMedia && (
                      <Skeleton
                        className="pb-[56.25%] w-full block"
                        style={getSkeletonStyle(media, length)}
                      />
                    )}
                    <img
                      src={getMediaUrl(media, 'medium')}
                      alt={media.ext_alt_text || 'Image'}
                      className={cn(
                        'm-0 object-cover object-center w-full h-full',
                        isInlineMedia ? 'relative' : 'absolute inset-0',
                      )}
                      draggable
                    />
                  </div>
                )
              : (
                  <div className="relative h-full w-full flex items-center justify-center">
                    {!isInlineMedia && (
                      <div
                        className="pb-[56.25%] w-full block"
                        style={getSkeletonStyle(media, length)}
                      />
                    )}
                    <TweetMediaVideo
                      media={media}
                    />
                  </div>
                )}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
