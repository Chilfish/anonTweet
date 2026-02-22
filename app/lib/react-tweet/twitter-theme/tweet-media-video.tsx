import type { MediaAnimatedGif, MediaVideo as TMediaVideo } from '~/types'
import { MediaImage } from '~/components/ui/media'
import { getMediaUrl } from '../utils'

interface Props {
  media: MediaAnimatedGif | TMediaVideo
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

export function TweetMediaVideo({ media }: Props) {
  const videoButtonClasses = 'absolute flex w-12 h-12 items-center justify-center bg-[#1d9bf0] hover:bg-[#1a8cd8] focus-visible:bg-[#1a8cd8] transition-colors duration-200 border-4 border-white rounded-full cursor-pointer'
  const imageClasses = 'absolute inset-0 m-0 object-cover object-center w-full h-full'

  const duration = media.video_info.duration
  const isGif = media.type === 'animated_gif'
  const badgeText = isGif ? 'GIF' : formatDuration(duration)

  return (
    <>
      <MediaImage
        src={getMediaUrl(media, 'large')}
        alt="Video"
        className={imageClasses}
        draggable
      />
      <button
        type="button"
        className={videoButtonClasses}
        aria-label="View video on X"
      >
        <svg
          viewBox="0 0 24 24"
          className="ml-[3px] w-[calc(50%+4px)] h-[calc(50%+4px)] max-w-full text-white fill-current select-none"
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
}
