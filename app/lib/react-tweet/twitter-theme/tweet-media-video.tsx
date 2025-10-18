import type { EnrichedQuotedTweet, EnrichedTweet, MediaAnimatedGif, MediaVideo } from '../api-v2'
import clsx from 'clsx'
import { useState } from 'react'
import {
  getMediaUrl,
  getMp4Video,
} from '../utils'
import { MediaImg } from './media-img'
import s from './tweet-media-video.module.css'
import mediaStyles from './tweet-media.module.css'

interface Props {
  tweet: EnrichedTweet | EnrichedQuotedTweet
  media: MediaAnimatedGif | MediaVideo
  showCoverOnly?: boolean
}

export function TweetMediaVideo({ tweet, media, showCoverOnly }: Props) {
  const [playButton, setPlayButton] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [ended, setEnded] = useState(false)
  const mp4Video = getMp4Video(media)
  let timeout = 0

  const PlayControlButton = () => (
    <button
      type="button"
      className={s.videoButton}
      aria-label="View video on X"
      onClick={(e) => {
        const video = e.currentTarget.previousSibling as HTMLMediaElement

        e.preventDefault()
        setPlayButton(false)
        video.load()
        video
          .play()
          .then(() => {
            setIsPlaying(true)
            video.focus()
          })
          .catch((error) => {
            console.error('Error playing video:', error)
            setPlayButton(true)
            setIsPlaying(false)
          })
      }}
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
  )

  if (showCoverOnly) {
    return (
      <>
        <MediaImg
          src={getMediaUrl(media, 'large')}
          alt="Video"
          className={mediaStyles.image}
          draggable
        />
        <PlayControlButton />
      </>
    )
  }

  return (
    <>
      <video
        className={mediaStyles.image}
        poster={getMediaUrl(media, 'small')}
        controls={!playButton}
        playsInline
        preload="none"
        tabIndex={playButton ? -1 : 0}
        onPlay={() => {
          if (timeout)
            window.clearTimeout(timeout)
          if (!isPlaying)
            setIsPlaying(true)
          if (ended)
            setEnded(false)
        }}
        onPause={() => {
          // When the video is seeked (moved to a different timestamp), it will pause for a moment
          // before resuming. We don't want to show the message in that case so we wait a bit.
          if (timeout)
            window.clearTimeout(timeout)
          timeout = window.setTimeout(() => {
            if (isPlaying)
              setIsPlaying(false)
            timeout = 0
          }, 100)
        }}
        onEnded={() => {
          setEnded(true)
        }}
      >
        <source src={mp4Video.url} type={mp4Video.content_type} />
      </video>

      {playButton && <PlayControlButton />}

      {!isPlaying && !ended && (
        <div className={s.watchOnTwitter}>
          <a
            href={tweet.url}
            className={s.anchor}
            target="_blank"
            rel="noopener noreferrer"
          >
            {playButton ? 'Watch on X' : 'Continue watching on X'}
          </a>
        </div>
      )}

      {ended && (
        <a
          href={tweet.url}
          className={clsx(s.anchor, s.viewReplies)}
          target="_blank"
          rel="noopener noreferrer"
        >
          View replies
        </a>
      )}
    </>
  )
}
