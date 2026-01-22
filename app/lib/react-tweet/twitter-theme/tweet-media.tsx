import type { EnrichedTweet, MediaDetails } from '~/types'
import clsx from 'clsx'
import { Fragment } from 'react'
import { MediaImage } from '~/components/ui/media'
import { getMediaUrl } from '../utils'
import { TweetMediaVideo } from './tweet-media-video'
import s from './tweet-media.module.css'

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
}

export function TweetMedia({ tweet, quoted, showCoverOnly }: Props) {
  const length = tweet.mediaDetails?.length ?? 0

  const isInlineMedia = !!tweet.isInlineMeida

  return (
    <div className={clsx(s.root, !quoted && s.rounded)}>
      <div
        className={clsx(
          s.mediaWrapper,
          isInlineMedia && s.inlineMedia,
          length > 1 && s.grid2Columns,
          length === 3 && s.grid3,
          length > 4 && s.grid2x2,
        )}
      >
        {tweet.mediaDetails?.map(media => (
          <Fragment key={media.media_url_https}>
            {media.type === 'photo'
              ? (
                  <div
                    key={media.media_url_https}
                    className={clsx(s.mediaContainer, s.mediaLink)}
                  >
                    <div
                      className={s.skeleton}
                      style={getSkeletonStyle(media, length)}
                    />
                    <MediaImage
                      src={getMediaUrl(media, 'medium')}
                      alt={media.ext_alt_text || 'Image'}
                      className={s.image}
                      draggable
                    />
                  </div>
                )
              : (
                  <div
                    key={media.media_url_https}
                    className={s.mediaContainer}
                  >
                    <div
                      className={s.skeleton}
                      style={getSkeletonStyle(media, length)}
                    />
                    <TweetMediaVideo
                      tweet={tweet}
                      media={media}
                      showCoverOnly={showCoverOnly}
                    />
                  </div>
                )}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
