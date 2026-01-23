import type { EnrichedTweet, MediaAnimatedGif, MediaVideo as TMediaVideo } from '~/types'
import { useRef, useState } from 'react'
import { MediaImage, MediaVideo } from '~/components/ui/media'
import {
  getMediaUrl,
  getMp4Video,
} from '../utils'
import s from './tweet-media-video.module.css'
import mediaStyles from './tweet-media.module.css'

interface Props {
  tweet: EnrichedTweet
  media: MediaAnimatedGif | TMediaVideo
  showCoverOnly?: boolean
}

export function TweetMediaVideo({ tweet, media, showCoverOnly }: Props) {
  'use no memo'

  const [showPlayButton, setShowPlayButton] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mp4Video = getMp4Video(media)

  const handlePlayClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const video = videoRef.current
    if (!video)
      return

    video.load()

    await video.play()
    video.focus()
    setShowPlayButton(false)
  }

  if (showCoverOnly) {
    return (
      <>
        <MediaImage
          src={getMediaUrl(media, 'large')}
          alt="Video"
          className={mediaStyles.image}
          draggable
        />
        <button
          type="button"
          className={s.videoButton}
          aria-label="View video on X"
        >
          <svg
            viewBox="0 0 24 24"
            className={s.videoButtonIcon}
            aria-hidden="true"
          >
            <g>
              <path d="M21 12L4 2v20l17-10z"></path>
            </g>
          </svg>
        </button>
      </>
    )
  }

  return (
    <>
      <MediaVideo
        ref={videoRef}
        className={mediaStyles.image}
        poster={getMediaUrl(media, 'small')}
        src={mp4Video.url}
        controls={!showPlayButton}
        playsInline
        tabIndex={showPlayButton ? -1 : 0}
      >
        <source src={mp4Video.url} type={mp4Video.content_type} />
      </MediaVideo>

      {showPlayButton && (
        <button
          type="button"
          className={s.videoButton}
          aria-label="View video on X"
          onClick={handlePlayClick}
        >
          <svg
            viewBox="0 0 24 24"
            className={s.videoButtonIcon}
            aria-hidden="true"
          >
            <g>
              <path d="M21 12L4 2v20l17-10z"></path>
            </g>
          </svg>
        </button>
      )}
    </>
  )
}
