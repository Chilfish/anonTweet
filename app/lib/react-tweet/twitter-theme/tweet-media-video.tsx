import type { EnrichedTweet, MediaAnimatedGif, MediaVideo as TMediaVideo } from '~/types'
import { MediaImage } from '~/components/ui/media'
import {
  getMediaUrl,
} from '../utils'
import s from './tweet-media-video.module.css'
import mediaStyles from './tweet-media.module.css'

interface Props {
  tweet: EnrichedTweet
  media: MediaAnimatedGif | TMediaVideo
  showCoverOnly?: boolean
}

function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const s = seconds % 60
  const m = minutes % 60

  if (hours > 0) {
    return `${hours}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function TweetMediaVideo({ tweet, media, showCoverOnly }: Props) {
  // const [showPlayButton, setShowPlayButton] = useState(true)
  // const videoRef = useRef<HTMLVideoElement>(null)
  // const mp4Video = getMp4Video(media)
  const duration = media.video_info.duration
  const isGif = media.type === 'animated_gif'

  // const handlePlayClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
  //   e.preventDefault()
  //   e.stopPropagation()

  //   const video = videoRef.current
  //   if (!video)
  //     return

  //   await video.play()
  //   video.focus()
  //   setShowPlayButton(false)
  // }

  const badgeText = isGif ? 'GIF' : formatDuration(duration)

  // if (showCoverOnly) {
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

      {duration > 0 && (
        <div className="absolute bottom-3 left-3 z-10 rounded bg-black/70 px-1.5 py-1 text-[13px] font-bold text-white leading-none">
          {badgeText}
        </div>
      )}
    </>
  )
  // }

  /*

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
        <>
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

          {duration > 0 && (
            <div className="absolute bottom-2 left-2 z-10 rounded bg-black/70 px-1 py-0.5 text-[13px] font-bold text-white leading-none">
              {badgeText}
            </div>
          )}
        </>
      )}
      </>
  )
      */
}
