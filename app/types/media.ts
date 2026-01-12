export interface VideoInfo {
  aspect_ratio: [number, number]
  variants: {
    bitrate?: number
    content_type: 'video/mp4' | 'application/x-mpegURL'
    url: string
  }[]
}

interface MediaBase {
  media_url_https: string
  index: number
  original_info: {
    height: number
    width: number
  }
}

export interface MediaPhoto extends MediaBase {
  type: 'photo'
  ext_alt_text?: string
}

export interface MediaAnimatedGif extends MediaBase {
  type: 'animated_gif'
  video_info: VideoInfo
}

export interface MediaVideo extends MediaBase {
  type: 'video'
  video_info: VideoInfo
}

export type MediaDetails = MediaPhoto | MediaAnimatedGif | MediaVideo
